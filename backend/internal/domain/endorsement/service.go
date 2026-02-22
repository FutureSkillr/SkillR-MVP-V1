package endorsement

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, learnerID uuid.UUID, limit, offset int) ([]Endorsement, int, error) {
	return s.repo.List(ctx, learnerID, limit, offset)
}

func (s *Service) Submit(ctx context.Context, req SubmitEndorsementRequest) (*Endorsement, error) {
	if req.InvitationToken == "" {
		return nil, fmt.Errorf("invitation_token is required")
	}

	invite, err := s.repo.GetInviteByToken(ctx, req.InvitationToken)
	if err != nil {
		return nil, fmt.Errorf("invalid invitation token")
	}

	if invite.Status != "pending" {
		return nil, fmt.Errorf("invitation already used or expired")
	}
	if time.Now().After(invite.ExpiresAt) {
		return nil, fmt.Errorf("invitation has expired")
	}

	endorsement := &Endorsement{
		ID:               uuid.New(),
		LearnerID:        invite.LearnerID,
		EndorserName:     req.EndorserName,
		EndorserRole:     req.EndorserRole,
		EndorserVerified: false,
		SkillDimensions:  req.SkillDimensions,
		Statement:        req.Statement,
		Context:          req.Context,
		Visible:          true,
		CreatedAt:        time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, endorsement); err != nil {
		return nil, fmt.Errorf("create endorsement: %w", err)
	}

	_ = s.repo.MarkInviteCompleted(ctx, req.InvitationToken)
	return endorsement, nil
}

func (s *Service) Invite(ctx context.Context, learnerID uuid.UUID, req EndorsementInviteRequest) (*EndorsementInvite, error) {
	if req.EndorserEmail == "" {
		return nil, fmt.Errorf("endorser_email is required")
	}

	token := generateToken()
	invite := &EndorsementInvite{
		ID:            uuid.New(),
		LearnerID:     learnerID,
		EndorserEmail: req.EndorserEmail,
		EndorserRole:  req.EndorserRole,
		Status:        "pending",
		InviteURL:     fmt.Sprintf("/endorse?token=%s", token),
		CreatedAt:     time.Now().UTC(),
		ExpiresAt:     time.Now().Add(30 * 24 * time.Hour).UTC(),
	}

	if err := s.repo.CreateInvite(ctx, invite); err != nil {
		return nil, fmt.Errorf("create invite: %w", err)
	}
	return invite, nil
}

func (s *Service) Pending(ctx context.Context, learnerID uuid.UUID) ([]EndorsementInvite, int, error) {
	return s.repo.ListPendingInvites(ctx, learnerID)
}

func (s *Service) Visibility(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, visible bool) (*Endorsement, error) {
	return s.repo.UpdateVisibility(ctx, id, learnerID, visible)
}

func generateToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
