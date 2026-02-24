package portfolio

import (
	"archive/zip"
	"bytes"
	"fmt"
	"html/template"
	"strings"
)

const portfolioHTMLTemplate = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{.DisplayName}} — SkillR Portfolio</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6;padding:2rem 1rem}
.container{max-width:800px;margin:0 auto}
header{text-align:center;margin-bottom:3rem;padding:2rem;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.15));border-radius:1rem;border:1px solid rgba(148,163,184,.1)}
header h1{font-size:2rem;background:linear-gradient(135deg,#818cf8,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
header p{color:#94a3b8;margin-top:.5rem;font-size:.9rem}
.badge{display:inline-block;font-size:.75rem;padding:.25rem .75rem;border-radius:9999px;font-weight:500}
.badge-project{background:rgba(59,130,246,.15);color:#60a5fa;border:1px solid rgba(59,130,246,.25)}
.badge-deliverable{background:rgba(16,185,129,.15);color:#34d399;border:1px solid rgba(16,185,129,.25)}
.badge-example{background:rgba(249,115,22,.15);color:#fb923c;border:1px solid rgba(249,115,22,.25)}
.badge-public{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)}
.badge-private{background:rgba(100,116,139,.15);color:#94a3b8;border:1px solid rgba(100,116,139,.25)}
.entries{display:grid;gap:1.5rem}
.entry{background:rgba(30,41,59,.8);border:1px solid rgba(148,163,184,.1);border-radius:1rem;padding:1.5rem}
.entry h3{font-size:1.1rem;color:#f1f5f9;margin-bottom:.5rem}
.entry p{color:#94a3b8;font-size:.9rem;margin-bottom:1rem}
.entry-meta{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.tags{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}
.tag{font-size:.7rem;padding:.2rem .6rem;border-radius:9999px;background:rgba(139,92,246,.15);color:#a78bfa;border:1px solid rgba(139,92,246,.25)}
footer{text-align:center;margin-top:3rem;padding-top:2rem;border-top:1px solid rgba(148,163,184,.1);color:#475569;font-size:.8rem}
footer a{color:#818cf8;text-decoration:none}
</style>
</head>
<body>
<div class="container">
<header>
<h1>{{.DisplayName}}</h1>
<p>SkillR Portfolio — {{.EntryCount}} {{if eq .EntryCount 1}}Eintrag{{else}}Eintraege{{end}}</p>
</header>
<div class="entries">
{{range .Entries}}<div class="entry">
<h3>{{.Title}}</h3>
{{if .Description}}<p>{{.Description}}</p>{{end}}
<div class="entry-meta">
<span class="badge badge-{{.Category}}">{{.Category}}</span>
<span class="badge badge-{{.Visibility}}">{{if eq .Visibility "public"}}Oeffentlich{{else}}Privat{{end}}</span>
</div>
{{if .Tags}}<div class="tags">{{range .Tags}}<span class="tag">{{.}}</span>{{end}}</div>{{end}}
</div>
{{end}}
</div>
<footer>
<p>Erstellt mit <a href="{{.BaseURL}}">SkillR</a></p>
</footer>
</div>
</body>
</html>`

type templateData struct {
	DisplayName string
	Entries     []PortfolioEntry
	EntryCount  int
	BaseURL     string
}

// renderPortfolioHTML renders a self-contained HTML page from the portfolio entries.
// baseURL is the scheme+host used for the "Erstellt mit SkillR" link (e.g. "http://localhost:9090").
// If empty, defaults to "https://skillr.app".
func renderPortfolioHTML(displayName string, entries []PortfolioEntry, baseURL string) string {
	tmpl, err := template.New("portfolio").Parse(portfolioHTMLTemplate)
	if err != nil {
		return fmt.Sprintf("<html><body><h1>Error rendering portfolio: %s</h1></body></html>", err.Error())
	}

	if baseURL == "" {
		baseURL = "https://skillr.app"
	}

	data := templateData{
		DisplayName: displayName,
		Entries:     entries,
		EntryCount:  len(entries),
		BaseURL:     baseURL,
	}

	var buf strings.Builder
	if err := tmpl.Execute(&buf, data); err != nil {
		return fmt.Sprintf("<html><body><h1>Error rendering portfolio: %s</h1></body></html>", err.Error())
	}
	return buf.String()
}

// buildPortfolioZIP creates a ZIP archive containing the portfolio as index.html.
func buildPortfolioZIP(html string) ([]byte, error) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	f, err := w.Create("index.html")
	if err != nil {
		return nil, fmt.Errorf("create zip entry: %w", err)
	}
	if _, err := f.Write([]byte(html)); err != nil {
		return nil, fmt.Errorf("write zip entry: %w", err)
	}
	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("close zip: %w", err)
	}
	return buf.Bytes(), nil
}
