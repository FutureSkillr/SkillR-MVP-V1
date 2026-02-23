package solid

import (
	"fmt"
	"strings"
	"time"
)

// Namespace prefixes for Turtle serialization (TC-019).
const (
	NSFutureSkiller = "https://vocab.maindset.academy/ns/"
	NSFoaf          = "http://xmlns.com/foaf/0.1/"
	NSXSD           = "http://www.w3.org/2001/XMLSchema#"
)

// turtlePrefixes returns the standard prefix declarations for all Turtle documents.
func turtlePrefixes() string {
	return `@prefix fs: <` + NSFutureSkiller + `> .
@prefix foaf: <` + NSFoaf + `> .
@prefix xsd: <` + NSXSD + `> .

`
}

// SerializeUserProfile converts a UserRow into Turtle format.
func SerializeUserProfile(user UserRow) string {
	var b strings.Builder
	b.WriteString(turtlePrefixes())
	b.WriteString("<> a fs:UserProfile ;\n")
	fmt.Fprintf(&b, "    fs:userId %q ;\n", user.ID)
	fmt.Fprintf(&b, "    foaf:name %q ;\n", user.Name)
	fmt.Fprintf(&b, "    foaf:mbox %q ;\n", user.Email)
	fmt.Fprintf(&b, "    fs:updatedAt %q^^xsd:dateTime .\n", time.Now().UTC().Format(time.RFC3339))
	return b.String()
}

// SerializeSkillProfile converts a SkillProfileRow into Turtle format.
func SerializeSkillProfile(sp SkillProfileRow) string {
	var b strings.Builder
	b.WriteString(turtlePrefixes())
	b.WriteString("<> a fs:SkillProfile ;\n")
	fmt.Fprintf(&b, "    fs:profileId %q ;\n", sp.ID)
	fmt.Fprintf(&b, "    fs:userId %q ;\n", sp.UserID)
	for cat, score := range sp.Categories {
		fmt.Fprintf(&b, "    fs:category [ fs:name %q ; fs:score \"%.2f\"^^xsd:decimal ] ;\n", cat, score)
	}
	fmt.Fprintf(&b, "    fs:createdAt %q^^xsd:dateTime .\n", sp.CreatedAt.UTC().Format(time.RFC3339))
	return b.String()
}

// SerializeEngagement converts EngagementData into Turtle format.
func SerializeEngagement(e EngagementData) string {
	var b strings.Builder
	b.WriteString(turtlePrefixes())
	b.WriteString("<> a fs:EngagementState ;\n")
	fmt.Fprintf(&b, "    fs:totalXP \"%d\"^^xsd:integer ;\n", e.TotalXP)
	fmt.Fprintf(&b, "    fs:level \"%d\"^^xsd:integer ;\n", e.Level)
	fmt.Fprintf(&b, "    fs:streak \"%d\"^^xsd:integer ;\n", e.Streak)
	fmt.Fprintf(&b, "    fs:title %q ;\n", e.Title)
	fmt.Fprintf(&b, "    fs:updatedAt %q^^xsd:dateTime .\n", time.Now().UTC().Format(time.RFC3339))
	return b.String()
}

// SerializeJourneyProgress converts JourneyProgressData into Turtle format.
func SerializeJourneyProgress(jp JourneyProgressData) string {
	var b strings.Builder
	b.WriteString(turtlePrefixes())
	b.WriteString("<> a fs:JourneyProgress ;\n")
	i := 0
	total := len(jp)
	for jType, progress := range jp {
		i++
		sep := " ;"
		if i == total {
			sep = " ."
		}
		b.WriteString("    fs:journey [\n")
		fmt.Fprintf(&b, "        fs:journeyType %q ;\n", jType)
		fmt.Fprintf(&b, "        fs:started \"%t\"^^xsd:boolean ;\n", progress.Started)
		fmt.Fprintf(&b, "        fs:stationsCompleted \"%d\"^^xsd:integer ;\n", progress.StationsCompleted)
		for dim, score := range progress.DimensionScores {
			fmt.Fprintf(&b, "        fs:dimensionScore [ fs:dimension %q ; fs:score \"%.2f\"^^xsd:decimal ] ;\n", dim, score)
		}
		fmt.Fprintf(&b, "    ]%s\n", sep)
	}
	if total == 0 {
		fmt.Fprintf(&b, "    fs:updatedAt %q^^xsd:dateTime .\n", time.Now().UTC().Format(time.RFC3339))
	}
	return b.String()
}

// SerializeReflection converts a ReflectionRow into Turtle format.
func SerializeReflection(r ReflectionRow) string {
	var b strings.Builder
	b.WriteString(turtlePrefixes())
	b.WriteString("<> a fs:Reflection ;\n")
	fmt.Fprintf(&b, "    fs:reflectionId %q ;\n", r.ID)
	fmt.Fprintf(&b, "    fs:questionId %q ;\n", r.QuestionID)
	fmt.Fprintf(&b, "    fs:response %q ;\n", r.Response)
	fmt.Fprintf(&b, "    fs:capabilityScores %q ;\n", string(r.CapabilityScores))
	fmt.Fprintf(&b, "    fs:createdAt %q^^xsd:dateTime .\n", r.CreatedAt.UTC().Format(time.RFC3339))
	return b.String()
}
