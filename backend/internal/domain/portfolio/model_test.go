package portfolio

import (
	"strings"
	"testing"
)

func TestCreateEntryRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     CreateEntryRequest
		wantErr string
	}{
		{
			name:    "valid project",
			req:     CreateEntryRequest{Title: "My Project", Category: "project", Visibility: "public"},
			wantErr: "",
		},
		{
			name:    "valid deliverable with tags",
			req:     CreateEntryRequest{Title: "Workshop", Category: "deliverable", Visibility: "public", Tags: []string{"Design", "Teamwork"}},
			wantErr: "",
		},
		{
			name:    "valid private example",
			req:     CreateEntryRequest{Title: "Notes", Category: "example", Visibility: "private"},
			wantErr: "",
		},
		{
			name:    "empty title",
			req:     CreateEntryRequest{Title: "", Category: "project", Visibility: "public"},
			wantErr: "title is required",
		},
		{
			name:    "title too long",
			req:     CreateEntryRequest{Title: strings.Repeat("a", 201), Category: "project", Visibility: "public"},
			wantErr: "title must be at most 200 characters",
		},
		{
			name:    "description too long",
			req:     CreateEntryRequest{Title: "OK", Description: strings.Repeat("a", 2001), Category: "project", Visibility: "public"},
			wantErr: "description must be at most 2000 characters",
		},
		{
			name:    "invalid category",
			req:     CreateEntryRequest{Title: "OK", Category: "blog", Visibility: "public"},
			wantErr: "category must be one of",
		},
		{
			name:    "invalid visibility",
			req:     CreateEntryRequest{Title: "OK", Category: "project", Visibility: "hidden"},
			wantErr: "visibility must be one of",
		},
		{
			name:    "too many tags",
			req:     CreateEntryRequest{Title: "OK", Category: "project", Visibility: "public", Tags: make([]string, 11)},
			wantErr: "at most 10 tags allowed",
		},
		{
			name:    "tag too long",
			req:     CreateEntryRequest{Title: "OK", Category: "project", Visibility: "public", Tags: []string{strings.Repeat("a", 51)}},
			wantErr: "each tag must be at most 50 characters",
		},
		{
			name:    "empty tag string",
			req:     CreateEntryRequest{Title: "OK", Category: "project", Visibility: "public", Tags: []string{"good", ""}},
			wantErr: "tags must not be empty strings",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr == "" {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}
			} else {
				if err == nil {
					t.Errorf("expected error containing %q, got nil", tt.wantErr)
				} else if !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("expected error containing %q, got: %v", tt.wantErr, err)
				}
			}
		})
	}
}
