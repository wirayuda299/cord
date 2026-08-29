package safety

import (
	"sync"
	"time"
)

// In-memory cache for safety settings, since they're read on the hot path
// (every message send checks them) but change rarely. Not shared across
// replicas — fine here since this backend runs as a single instance.
const safetyCacheTTL = 30 * time.Second

type safetyCacheEntry struct {
	settings  *SafetySetup
	expiresAt time.Time
}

var (
	safetyCacheMu sync.RWMutex
	safetyCache   = make(map[string]safetyCacheEntry)
)

func getCachedSafetySettings(serverID string) (*SafetySetup, bool) {
	safetyCacheMu.RLock()
	defer safetyCacheMu.RUnlock()

	entry, ok := safetyCache[serverID]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.settings, true
}

func setCachedSafetySettings(serverID string, s *SafetySetup) {
	safetyCacheMu.Lock()
	defer safetyCacheMu.Unlock()

	safetyCache[serverID] = safetyCacheEntry{settings: s, expiresAt: time.Now().Add(safetyCacheTTL)}
}

func invalidateSafetyCache(serverID string) {
	safetyCacheMu.Lock()
	defer safetyCacheMu.Unlock()

	delete(safetyCache, serverID)
}
