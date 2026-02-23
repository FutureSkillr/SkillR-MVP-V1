package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminUser struct {
	ID           uuid.UUID  `json:"id"`
	Email        *string    `json:"email"`
	DisplayName  *string    `json:"displayName"`
	Role         string     `json:"role"`
	AuthProvider string     `json:"authProvider"`
	PhotoURL     *string    `json:"photoURL,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

type UserAdminRepository struct {
	pool *pgxpool.Pool
}

func NewUserAdminRepository(pool *pgxpool.Pool) *UserAdminRepository {
	return &UserAdminRepository{pool: pool}
}

func (r *UserAdminRepository) ListUsers(ctx context.Context) ([]AdminUser, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, email, display_name, role, auth_provider, photo_url, created_at
		 FROM users ORDER BY created_at ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var u AdminUser
		if err := rows.Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &u.AuthProvider, &u.PhotoURL, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan user row: %w", err)
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserAdminRepository) UpdateRole(ctx context.Context, id uuid.UUID, role string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE users SET role = $1::user_role WHERE id = $2`,
		role, id,
	)
	if err != nil {
		return fmt.Errorf("update user role: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

func (r *UserAdminRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}
