// Package migrations holds goose SQL migrations, embedded into the binary
// so deploys don't need the .sql files copied alongside it separately.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
