package messages

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/services/servers/safety"
	"github.com/wirayuda299/backend/internal/utils"
)

type Message struct {
	Message         string  `json:"message"`
	AttachmentURL   string  `json:"attachment_url"`
	AttachmentID    string  `json:"attachment_id"`
	UserID          string  `json:"user_id"`
	ParentMessageID *string `json:"parent_message_id"`
	ThreadID        *string `json:"thread_id"`
}

type SaveMsgPayload struct {
	ctx       context.Context
	db        *databases.Container
	channelID string
	message   Message
	userID    string
	// username/avatar: pass these in when the caller already has them
	// (e.g. resolved once at websocket handshake) to skip the per-message
	// user lookup. Left empty, saveMsg falls back to querying for them.
	username string
	avatar   string
}

func saveMsg(p *SaveMsgPayload) (*services.MessageRow, error) {

	var row services.MessageRow

	var parentMsgID *string
	var threadID *string
	var channelIDOut *string
	var channelIDArg any = p.channelID
	var threadIDArg any = nil

	if p.message.ThreadID != nil && *p.message.ThreadID != "" {
		channelIDArg = nil
		threadIDArg = p.message.ThreadID
	} else {
		threadIDArg = nil
	}

	err := p.db.Postgres.QueryRow(p.ctx, `
	INSERT INTO messages (
		content,
		user_id,
		image_url,
		image_asset_id,
		channel_id,
		parent_msg_id,
		thread_id
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING
		id,
		content,
		user_id,
		image_url,
		image_asset_id,
		channel_id,
		created_at,
		updated_at,
		parent_msg_id,
		thread_id
`,
		p.message.Message,
		p.userID,
		p.message.AttachmentURL,
		p.message.AttachmentID,
		channelIDArg,
		p.message.ParentMessageID,
		threadIDArg,
	).Scan(
		&row.ID,
		&row.Content,
		&row.UserID,
		&row.ImageURL,
		&row.ImageAssetID,
		&channelIDOut,
		&row.CreatedAt,
		&row.UpdatedAt,
		&parentMsgID,
		&threadID,
	)
	if err != nil {
		return nil, fmt.Errorf("error inserting message: %w", err)
	}

	row.ChannelID = channelIDOut
	row.ParentMsgID = parentMsgID
	row.ThreadID = threadID
	row.Threads = make([]services.ThreadRow, 0)
	row.Reactions = make([]services.ReactionRow, 0)

	if p.username != "" {
		row.Username = p.username
		row.Avatar = p.avatar
	} else {
		err = p.db.Postgres.QueryRow(
			p.ctx,
			`SELECT username, COALESCE(avatar_url, '') FROM users WHERE id = $1`,
			p.userID,
		).Scan(&row.Username, &row.Avatar)
		if err != nil {
			return nil, fmt.Errorf("error fetching user: %w", err)
		}
	}

	if parentMsgID != nil {
		err = p.db.Postgres.QueryRow(p.ctx, `
		SELECT m.content, u.username
		FROM messages AS m
		LEFT JOIN users AS u ON m.user_id = u.id
		WHERE m.id = $1
	`, parentMsgID).Scan(&row.ParentContent, &row.ParentUsername)
		if err != nil {
			return nil, fmt.Errorf("failed to get parent message %w", err)
		}
	}

	return &row, nil
}

type Member struct {
	user_id   string
	joined_at time.Time
}

func getServerMember(ctx context.Context, db *databases.Container, userID string, serverID string) (Member, error) {

	var m Member
	err := db.Postgres.QueryRow(ctx, "SELECT user_id,joined_at from members where user_id = $1 and server_id = $2", userID, serverID).Scan(&m.user_id, &m.joined_at)

	return m, err
}

func getServerOwner(ctx context.Context, db *databases.Container, serverID string) (string, error) {
	var serverOwner string
	err := db.Postgres.QueryRow(ctx, "SELECT created_by from servers where id = $1", serverID).Scan(&serverOwner)

	return serverOwner, err

}

// username/avatar are resolved once at websocket handshake time and passed
// through so saveMsg can skip its own per-message lookup; pass "" for both
// to fall back to querying (e.g. any future non-websocket caller).
func Send(ctx context.Context, m Message, db *databases.Container, channelID string, serverID string, username string, avatar string) (*services.MessageRow, error) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, fmt.Errorf("error inserting message: %w", err)
	}

	if serverID == "" || serverID == "dm" {
		hasAccess, err := members.VerifyChannelAccess(ctx, db, channelID)
		if err != nil {
			return nil, fmt.Errorf("error verifying channel access: %w", err)
		}
		if !hasAccess {
			return nil, errors.New("you do not have access to this channel")
		}

		row, err := saveMsg(&SaveMsgPayload{
			ctx:       ctx,
			db:        db,
			channelID: channelID,
			message:   m,
			userID:    userID,
			username:  username,
			avatar:    avatar,
		})
		if err != nil {
			return nil, err
		}
		return row, nil
	}

	/* safety level of server settings
	- if low, allow send message without any check
	- if medium, allow send message only user already join a server greater than 5 mins
	- if high allow send message only user already join a server greater than 10 mins
	- if highest, allow send message if they have verified phone number on their account
	*/

	// These five reads don't depend on each other, so fire them off
	// together instead of paying for round-trip latency five times in a
	// row on the hot path of every message send.
	var (
		wg sync.WaitGroup

		isJoin  bool
		joinErr *httputil.ErrorResponse

		isBanned bool
		banErr   error

		owner    string
		ownerErr error

		safetySettings *safety.SafetySetup
		safetyErr      *httputil.ErrorResponse

		member    Member
		memberErr error
	)

	wg.Add(5)
	go func() {
		defer wg.Done()
		isJoin, joinErr = members.IsUserJoinedServer(ctx, db, serverID)
	}()
	go func() {
		defer wg.Done()
		banErr = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bans WHERE server_id = $1 AND user_id = $2)", serverID, userID).Scan(&isBanned)
	}()
	go func() {
		defer wg.Done()
		owner, ownerErr = getServerOwner(ctx, db, serverID)
	}()
	go func() {
		defer wg.Done()
		safetySettings, safetyErr = safety.GetServerSafetySettings(ctx, db, serverID)
	}()
	go func() {
		defer wg.Done()
		// Only meaningful for the medium/high non-owner branches below;
		// harmless (and ignored) otherwise, e.g. ErrNoRows for an owner
		// who never got a `members` row of their own.
		member, memberErr = getServerMember(ctx, db, userID, serverID)
	}()
	wg.Wait()

	if joinErr != nil {
		return nil, joinErr.Err
	}
	if !isJoin {
		return nil, errors.New("you not member of this server")
	}

	if banErr != nil {
		return nil, fmt.Errorf("error checking ban status: %w", banErr)
	}
	if isBanned {
		return nil, errors.New("you are banned from this server")
	}

	if ownerErr != nil {
		return nil, fmt.Errorf("failed to fetch server owner: %w", ownerErr)
	}

	if owner == userID {
		row, err := saveMsg(&SaveMsgPayload{
			ctx:       ctx,
			db:        db,
			channelID: channelID,
			message:   m,
			userID:    userID,
			username:  username,
			avatar:    avatar,
		})

		if err != nil {
			return nil, err
		}

		return row, nil
	} else {
		if safetyErr != nil {
			return nil, safetyErr.Err
		}
		s := safetySettings
		switch s.Level {
		case "low":
			row, err := saveMsg(&SaveMsgPayload{
				ctx:       ctx,
				db:        db,
				channelID: channelID,
				message:   m,
				userID:    userID,
				username:  username,
				avatar:    avatar,
			})

			if err != nil {
				return nil, err
			}

			return row, nil
		case "medium":

			if memberErr != nil {
				if errors.Is(memberErr, pgx.ErrNoRows) {
					return nil, fmt.Errorf("member not found: %w", memberErr)
				}
				return nil, memberErr
			}

			if time.Now().After(member.joined_at.Add(5 * time.Minute)) {
				row, err := saveMsg(&SaveMsgPayload{
					ctx:       ctx,
					db:        db,
					channelID: channelID,
					message:   m,
					userID:    userID,
					username:  username,
					avatar:    avatar,
				})

				if err != nil {
					return nil, err
				}

				return row, nil

			} else {
				return nil, errors.New("you can send message if you join this server more than 5 minutes")
			}
		case "high":
			if memberErr != nil {
				if errors.Is(memberErr, pgx.ErrNoRows) {
					return nil, fmt.Errorf("member not found: %w", memberErr)
				}
				return nil, memberErr
			}

			if time.Now().After(member.joined_at.Add(10 * time.Minute)) {
				row, err := saveMsg(&SaveMsgPayload{
					ctx:       ctx,
					db:        db,
					channelID: channelID,
					message:   m,
					userID:    userID,
					username:  username,
					avatar:    avatar,
				})

				if err != nil {
					return nil, err
				}

				return row, nil

			} else {
				return nil, errors.New("you can send message if you join this server more than 10 minutes")
			}
		case "highest":
			usr, err := user.Get(ctx, userID)
			if err != nil {
				return nil, err
			}

			var verified bool
			for _, v := range usr.PhoneNumbers {
				if v.Verification.Status == "verified" {
					verified = true
				}
			}

			if verified {
				row, err := saveMsg(&SaveMsgPayload{
					ctx:       ctx,
					db:        db,
					channelID: channelID,
					message:   m,
					userID:    userID,
					username:  username,
					avatar:    avatar,
				})

				if err != nil {
					return nil, err
				}

				return row, nil
			} else {
				return nil, errors.New("you must have verified phone number to be able send message in this server")
			}
		default:
			return nil, errors.New("invalid member level")

		}
	}

}
