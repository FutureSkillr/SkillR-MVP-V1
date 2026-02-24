package postgres

import (
	"encoding/json"
	"testing"
)

func TestVideosetSubmission_JSONRoundtrip(t *testing.T) {
	sub := VideosetSubmission{
		ID:         "test-uuid",
		PackID:     "001",
		Title:      "Test Submission",
		Status:     "draft",
		VideoAType: "upload",
		VideoAValue: "video.mp4",
		VideoAEnvelope: json.RawMessage(`{"bucket":"test","key":"path/video.mp4","size":1024}`),
		VideoBType: "youtube",
		VideoBValue: "https://youtube.com/watch?v=abc123",
		DidacticsNotes: "Some notes",
	}

	data, err := json.Marshal(sub)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded VideosetSubmission
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if decoded.ID != sub.ID {
		t.Errorf("ID: expected %q, got %q", sub.ID, decoded.ID)
	}
	if decoded.PackID != sub.PackID {
		t.Errorf("PackID: expected %q, got %q", sub.PackID, decoded.PackID)
	}
	if decoded.Title != sub.Title {
		t.Errorf("Title: expected %q, got %q", sub.Title, decoded.Title)
	}
	if decoded.Status != sub.Status {
		t.Errorf("Status: expected %q, got %q", sub.Status, decoded.Status)
	}
	if decoded.VideoAType != sub.VideoAType {
		t.Errorf("VideoAType: expected %q, got %q", sub.VideoAType, decoded.VideoAType)
	}
	if decoded.VideoBType != sub.VideoBType {
		t.Errorf("VideoBType: expected %q, got %q", sub.VideoBType, decoded.VideoBType)
	}
	if decoded.DidacticsNotes != sub.DidacticsNotes {
		t.Errorf("DidacticsNotes: expected %q, got %q", sub.DidacticsNotes, decoded.DidacticsNotes)
	}
	if string(decoded.VideoAEnvelope) != string(sub.VideoAEnvelope) {
		t.Errorf("VideoAEnvelope: expected %s, got %s", sub.VideoAEnvelope, decoded.VideoAEnvelope)
	}
}

func TestVideosetSubmission_EmptyEnvelope(t *testing.T) {
	sub := VideosetSubmission{
		ID:     "test-uuid",
		PackID: "001",
		Title:  "No Videos",
		Status: "draft",
	}

	data, err := json.Marshal(sub)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded VideosetSubmission
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if decoded.VideoAEnvelope != nil {
		t.Errorf("expected nil VideoAEnvelope, got %s", decoded.VideoAEnvelope)
	}
	if decoded.VideoBEnvelope != nil {
		t.Errorf("expected nil VideoBEnvelope, got %s", decoded.VideoBEnvelope)
	}
}

func TestVideosetSubmission_StatusValues(t *testing.T) {
	validStatuses := []string{"draft", "submitted", "in_review", "completed", "rejected"}
	for _, status := range validStatuses {
		sub := VideosetSubmission{Status: status}
		data, err := json.Marshal(sub)
		if err != nil {
			t.Fatalf("marshal status %q: %v", status, err)
		}

		var decoded VideosetSubmission
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("unmarshal status %q: %v", status, err)
		}
		if decoded.Status != status {
			t.Errorf("expected status %q, got %q", status, decoded.Status)
		}
	}
}
