package portfolio

import (
	"archive/zip"
	"bytes"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestRenderPortfolioHTML_Empty(t *testing.T) {
	html := renderPortfolioHTML("Test User", nil, "")
	if !strings.Contains(html, "Test User") {
		t.Error("expected display name in HTML output")
	}
	if !strings.Contains(html, "0 Eintraege") {
		t.Error("expected '0 Eintraege' for empty entries")
	}
	if !strings.Contains(html, "SkillR Portfolio") {
		t.Error("expected 'SkillR Portfolio' in title")
	}
}

func TestRenderPortfolioHTML_SingleEntry(t *testing.T) {
	entries := []PortfolioEntry{
		{
			ID:          uuid.New(),
			Title:       "My Project",
			Description: "A test project",
			Category:    "project",
			Visibility:  "public",
			Tags:        []string{"Go", "Test"},
		},
	}
	html := renderPortfolioHTML("Jane", entries, "")
	if !strings.Contains(html, "1 Eintrag") {
		t.Error("expected '1 Eintrag' for single entry")
	}
	if !strings.Contains(html, "My Project") {
		t.Error("expected entry title in output")
	}
	if !strings.Contains(html, "A test project") {
		t.Error("expected description in output")
	}
	if !strings.Contains(html, "Go") {
		t.Error("expected tag 'Go' in output")
	}
}

func TestRenderPortfolioHTML_MultipleEntries(t *testing.T) {
	entries := []PortfolioEntry{
		{ID: uuid.New(), Title: "Entry 1", Category: "project", Visibility: "public"},
		{ID: uuid.New(), Title: "Entry 2", Category: "deliverable", Visibility: "private"},
	}
	html := renderPortfolioHTML("Max", entries, "")
	if !strings.Contains(html, "2 Eintraege") {
		t.Error("expected '2 Eintraege' for multiple entries")
	}
	if !strings.Contains(html, "Entry 1") {
		t.Error("expected 'Entry 1' in output")
	}
	if !strings.Contains(html, "Entry 2") {
		t.Error("expected 'Entry 2' in output")
	}
}

func TestBuildPortfolioZIP(t *testing.T) {
	html := "<html><body>test</body></html>"
	data, err := buildPortfolioZIP(html)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		t.Fatalf("failed to read zip: %v", err)
	}
	if len(r.File) != 1 {
		t.Fatalf("expected 1 file in zip, got %d", len(r.File))
	}
	if r.File[0].Name != "index.html" {
		t.Errorf("expected 'index.html', got %q", r.File[0].Name)
	}
}

func TestRenderPortfolioHTML_BaseURL(t *testing.T) {
	html := renderPortfolioHTML("User", nil, "http://localhost:9090")
	if !strings.Contains(html, `href="http://localhost:9090"`) {
		t.Error("expected custom baseURL in footer link")
	}

	htmlDefault := renderPortfolioHTML("User", nil, "")
	if !strings.Contains(htmlDefault, `href="https://skillr.app"`) {
		t.Error("expected default skillr.app URL when baseURL is empty")
	}
}

func TestRenderPortfolioHTML_ValidHTMLStructure(t *testing.T) {
	html := renderPortfolioHTML("User", nil, "")
	if !strings.HasPrefix(html, "<!DOCTYPE html>") {
		t.Error("expected HTML doctype")
	}
	if !strings.Contains(html, "</html>") {
		t.Error("expected closing html tag")
	}
	if !strings.Contains(html, `lang="de"`) {
		t.Error("expected German lang attribute")
	}
}
