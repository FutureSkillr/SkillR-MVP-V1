package solid

import (
	"strings"
	"testing"
	"time"
)

func TestSerializeUserProfile(t *testing.T) {
	user := UserRow{
		ID:    "user-123",
		Email: "test@example.com",
		Name:  "Test User",
	}

	turtle := SerializeUserProfile(user)

	checks := []string{
		"@prefix fs:",
		"@prefix foaf:",
		"<> a fs:UserProfile",
		`fs:userId "user-123"`,
		`foaf:name "Test User"`,
		`foaf:mbox "test@example.com"`,
		"fs:updatedAt",
		"^^xsd:dateTime",
	}

	for _, check := range checks {
		if !strings.Contains(turtle, check) {
			t.Errorf("expected turtle to contain %q, got:\n%s", check, turtle)
		}
	}
}

func TestSerializeSkillProfile(t *testing.T) {
	sp := SkillProfileRow{
		ID:     "sp-1",
		UserID: "user-123",
		Categories: map[string]float64{
			"Technik":    0.85,
			"Kreativitaet": 0.60,
		},
		CreatedAt: time.Date(2026, 2, 21, 10, 0, 0, 0, time.UTC),
	}

	turtle := SerializeSkillProfile(sp)

	checks := []string{
		"<> a fs:SkillProfile",
		`fs:profileId "sp-1"`,
		`fs:userId "user-123"`,
		"fs:category",
		"fs:name",
		"fs:score",
		"^^xsd:decimal",
		"2026-02-21",
	}

	for _, check := range checks {
		if !strings.Contains(turtle, check) {
			t.Errorf("expected turtle to contain %q, got:\n%s", check, turtle)
		}
	}
}

func TestSerializeEngagement(t *testing.T) {
	e := EngagementData{
		TotalXP: 1500,
		Level:   5,
		Streak:  3,
		Title:   "Entdecker",
	}

	turtle := SerializeEngagement(e)

	checks := []string{
		"<> a fs:EngagementState",
		`fs:totalXP "1500"^^xsd:integer`,
		`fs:level "5"^^xsd:integer`,
		`fs:streak "3"^^xsd:integer`,
		`fs:title "Entdecker"`,
	}

	for _, check := range checks {
		if !strings.Contains(turtle, check) {
			t.Errorf("expected turtle to contain %q, got:\n%s", check, turtle)
		}
	}
}

func TestSerializeJourneyProgress(t *testing.T) {
	jp := JourneyProgressData{
		"vuca": {
			Started:           true,
			StationsCompleted: 2,
			DimensionScores: map[string]float64{
				"volatility": 0.75,
			},
		},
	}

	turtle := SerializeJourneyProgress(jp)

	checks := []string{
		"<> a fs:JourneyProgress",
		`fs:journeyType "vuca"`,
		`fs:started "true"^^xsd:boolean`,
		`fs:stationsCompleted "2"^^xsd:integer`,
		`fs:dimension "volatility"`,
	}

	for _, check := range checks {
		if !strings.Contains(turtle, check) {
			t.Errorf("expected turtle to contain %q, got:\n%s", check, turtle)
		}
	}
}

func TestSerializeJourneyProgress_Empty(t *testing.T) {
	jp := JourneyProgressData{}
	turtle := SerializeJourneyProgress(jp)

	if !strings.Contains(turtle, "fs:updatedAt") {
		t.Error("empty journey progress should include updatedAt")
	}
}

func TestSerializeReflection(t *testing.T) {
	r := ReflectionRow{
		ID:         "ref-1",
		UserID:     "user-123",
		QuestionID: "q-42",
		Answer:     "Ich habe gelernt...",
		Score:      0.92,
		CreatedAt:  time.Date(2026, 2, 21, 14, 30, 0, 0, time.UTC),
	}

	turtle := SerializeReflection(r)

	checks := []string{
		"<> a fs:Reflection",
		`fs:reflectionId "ref-1"`,
		`fs:questionId "q-42"`,
		`fs:answer "Ich habe gelernt..."`,
		`fs:score "0.92"^^xsd:decimal`,
		"2026-02-21",
	}

	for _, check := range checks {
		if !strings.Contains(turtle, check) {
			t.Errorf("expected turtle to contain %q, got:\n%s", check, turtle)
		}
	}
}

func TestTurtlePrefixes(t *testing.T) {
	prefixes := turtlePrefixes()
	if !strings.Contains(prefixes, NSFutureSkiller) {
		t.Error("prefixes should contain fs: namespace")
	}
	if !strings.Contains(prefixes, NSFoaf) {
		t.Error("prefixes should contain foaf: namespace")
	}
	if !strings.Contains(prefixes, NSXSD) {
		t.Error("prefixes should contain xsd: namespace")
	}
}

func TestSanitizeUsername(t *testing.T) {
	tests := []struct {
		input, want string
	}{
		{"user-123", "user-123"},
		{"user@email.com", "user-email-com"},
		{"abc123", "abc123"},
		{"hello world!", "hello-world-"},
	}
	for _, tt := range tests {
		got := sanitizeUsername(tt.input)
		if got != tt.want {
			t.Errorf("sanitizeUsername(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
