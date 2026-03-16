const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Reusable helpers ────────────────────────────────────────────

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const darkBorder = { style: BorderStyle.SINGLE, size: 1, color: "3f3f46" };
const darkBorders = { top: darkBorder, bottom: darkBorder, left: darkBorder, right: darkBorder };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function para(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, ...opts })];
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: runs,
  });
}

function bold(text) { return new TextRun({ text, bold: true }); }
function mono(text) { return new TextRun({ text, font: "Courier New", size: 18 }); }
function italic(text) { return new TextRun({ text, italics: true, color: "71717a" }); }

function spacer() { return new Paragraph({ spacing: { after: 80 }, children: [] }); }

// Table helpers
const TABLE_WIDTH = 9360; // US Letter - 1" margins

function headerCell(text, width, span) {
  return new TableCell({
    borders: darkBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "18181b", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    columnSpan: span,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 18 })] })],
  });
}

function cell(text, width, opts = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, font: "Arial", size: 18, ...opts })];
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: runs })],
  });
}

function twoColTable(data, col1W, col2W) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [col1W, col2W],
    rows: data.map((row, idx) =>
      new TableRow({
        children: [
          cell(row[0], col1W, { bold: true, shade: idx === 0 ? undefined : (idx % 2 === 0 ? "f4f4f5" : undefined) }),
          cell(row[1], col2W, { shade: idx === 0 ? undefined : (idx % 2 === 0 ? "f4f4f5" : undefined) }),
        ],
      })
    ),
  });
}

// ── Document content ────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "18181b" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "27272a" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "3f3f46" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ],
  },
  sections: [
    // ═════════════════════════════ COVER PAGE ═════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(), spacer(), spacer(), spacer(), spacer(),
        spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "M&A OS PORTAL", bold: true, size: 56, font: "Arial", color: "18181b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Deal Execution Platform", size: 28, color: "71717a" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [new TextRun({ text: "AUDIT TECHNIQUE COMPLET", bold: true, size: 40, color: "18181b" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Architecture, Moteur de Calcul FEC, Outputs & Mapping", size: 24, color: "71717a" })],
        }),
        spacer(), spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 2.0 \u2014 Mars 2026", size: 22, color: "a1a1aa" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Alvora Partners \u2014 Confidentiel", size: 22, color: "a1a1aa" })],
        }),
      ],
    },

    // ═════════════════════════════ MAIN CONTENT ═════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "M&A OS Portal \u2014 Audit Technique", size: 16, color: "a1a1aa", italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Confidentiel \u2014 Alvora Partners \u2014 Page ", size: 16, color: "a1a1aa" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "a1a1aa" }),
            ],
          })],
        }),
      },
      children: [
        // ── 1. VUE D'ENSEMBLE ──
        heading("1. Vue d\u2019ensemble de la plateforme"),
        para("M&A OS est une plateforme SaaS destin\u00e9e aux investment bankers pour l\u2019ex\u00e9cution de mandats M&A (sell-side, buy-side, valorisation). Le premier module actif est le FEC Analyzer, qui transforme les Fichiers des \u00c9critures Comptables (norme DGFiP) en analyses financi\u00e8res structur\u00e9es pour la due diligence."),

        heading("1.1 Stack technique", HeadingLevel.HEADING_2),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [3000, 3000, 3360],
          rows: [
            new TableRow({ children: [
              headerCell("Couche", 3000), headerCell("Technologie", 3000), headerCell("Version", 3360),
            ]}),
            ...([
              ["Frontend", "Next.js (App Router)", "16.1.6"],
              ["Runtime", "React + TypeScript", "19.2.3 / 5.x"],
              ["Styles", "Tailwind CSS + shadcn/ui", "4.x / 4.0.2"],
              ["Graphiques", "Recharts", "3.8.0"],
              ["Auth & DB", "Supabase (SSR)", "2.99.0"],
              ["Ic\u00f4nes", "Lucide React", "0.577.0"],
              ["H\u00e9bergement", "Vercel", "Edge Runtime"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 3000, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 3000, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 3360, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),
        spacer(),

        heading("1.2 Flux d\u2019authentification", HeadingLevel.HEADING_2),
        para("Le middleware Next.js intercepte chaque requ\u00eate et impose un flux s\u00e9quentiel strict :"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Utilisateur non authentifi\u00e9 \u2192 redirection vers /login")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Authentifi\u00e9 sans NDA sign\u00e9 \u2192 redirection forc\u00e9e vers /nda")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Authentifi\u00e9 + NDA \u2192 acc\u00e8s au dashboard et aux modules")] }),
        spacer(),
        para("Supabase g\u00e8re 4 clients distincts : browser (CSR), server (SSR via cookies), middleware (requ\u00eate/r\u00e9ponse), admin (op\u00e9rations privil\u00e9gi\u00e9es). Le RLS (Row Level Security) est activ\u00e9 sur les 3 tables : profiles, nda_signatures, os_modules."),

        heading("1.3 Sch\u00e9ma base de donn\u00e9es", HeadingLevel.HEADING_2),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [2400, 3480, 3480],
          rows: [
            new TableRow({ children: [
              headerCell("Table", 2400), headerCell("Colonnes cl\u00e9s", 3480), headerCell("R\u00f4le", 3480),
            ]}),
            ...([
              ["profiles", "id, email, full_name, company, role", "Profil utilisateur (auto-cr\u00e9\u00e9 via trigger)"],
              ["nda_signatures", "user_id, signed_at, ip_address, full_name_typed", "Tra\u00e7abilit\u00e9 NDA"],
              ["os_modules", "slug, name, status, requires_role, sort_order", "Catalogue des modules"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 2400, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 3480, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 3480, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),

        // ── 2. FEC PARSER ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("2. Parsing du fichier FEC"),
        para("Le parser (parser.ts, 323 lignes) transforme un fichier brut .txt/.csv conforme DGFiP en un tableau typ\u00e9 de FecEntry[]. Il g\u00e8re les cas limites rencontr\u00e9s en pratique sur les FEC fran\u00e7ais."),

        heading("2.1 D\u00e9tection automatique", HeadingLevel.HEADING_2),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [3000, 6360],
          rows: [
            new TableRow({ children: [headerCell("Param\u00e8tre", 3000), headerCell("Gestion", 6360)] }),
            ...([
              ["Encodage", "UTF-8 (primaire) avec fallback Windows-1252 via TextDecoder"],
              ["S\u00e9parateur", "Auto-d\u00e9tection : tabulation, pipe (|), point-virgule (;)"],
              ["Format date", "YYYYMMDD (DGFiP), DD/MM/YYYY, YYYY-MM-DD"],
              ["Format nombre", "FR : \u00ab 1 234 567,89 \u00bb \u2192 1234567.89 (espaces ins\u00e9cables inclus)"],
              ["Colonnes requises", "JournalCode, EcritureDate, CompteNum, Debit, Credit"],
              ["Colonnes totales", "18 champs DGFiP standard"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 3000, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 6360, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),
        spacer(),

        heading("2.2 Validation", HeadingLevel.HEADING_2),
        para([
          new TextRun("Le parser valide chaque ligne : CompteNum obligatoire, EcritureDate valide. Les erreurs sont logu\u00e9es (max 50 d\u00e9taill\u00e9es, r\u00e9sum\u00e9 ensuite). Un "),
          bold("contr\u00f4le d\u2019\u00e9quilibre"),
          new TextRun(" d\u00e9bit/cr\u00e9dit est effectu\u00e9 en fin de parsing (warning si \u00e9cart > 0.01 \u20ac)."),
        ]),

        // ── 3. SYSTÈME DE MAPPING ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("3. Syst\u00e8me de mapping comptable"),
        para("Le fichier mapping.ts (1 680 lignes) contient 4 tables d\u00e9claratives JSON qui pilotent l\u2019int\u00e9gralit\u00e9 des calculs. Aucune logique m\u00e9tier n\u2019est hardcod\u00e9e : ajouter un compte ou un KPI se fait uniquement par ajout d\u2019une entr\u00e9e dans la table."),

        heading("3.1 R\u00e9f\u00e9rentiel PCG", HeadingLevel.HEADING_2),
        para([
          new TextRun("Version du mapping : "),
          mono("3.0-TS-Master"),
          new TextRun(" \u2014 R\u00e9f\u00e9rentiel : "),
          mono("PCG 2025"),
        ]),
        spacer(),
        para([bold("Constantes de filtrage :")]),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Journaux exclus du P&L : "), new TextRun("AN, RAN, ANOUV, OUV (\u00e0 nouveaux / ouverture)"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Journaux de cl\u00f4ture : "), new TextRun("CLO, SIT, BILAN \u2192 seuls les comptes 6x/7x sont retenus"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Comptes exclus : "), new TextRun("12x (affectation du r\u00e9sultat), 89x (transferts)"),
        ]}),

        heading("3.2 Table P&L SIG (65 lignes)", HeadingLevel.HEADING_2),
        para("Chaque ligne d\u00e9finit un poste du compte de r\u00e9sultat, avec un identifiant unique (PL_xxx), les pr\u00e9fixes PCG \u00e0 agr\u00e9ger, les exclusions, la convention de signe, et une formule pour les sous-totaux."),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [1200, 3300, 1560, 1800, 1500],
          rows: [
            new TableRow({ children: [
              headerCell("ID", 1200), headerCell("Libell\u00e9", 3300), headerCell("Type", 1560),
              headerCell("PCG Prefix", 1800), headerCell("Signe", 1500),
            ]}),
            ...([
              ["PL_010", "Ventes de marchandises", "account", "707", "C-D"],
              ["PL_030", "Chiffre d\u2019affaires net", "subtotal", "formule", "formule"],
              ["PL_080", "Achats marchandises", "account", "607", "D-C"],
              ["PL_150", "Valeur ajout\u00e9e", "subtotal", "formule", "formule"],
              ["PL_170", "Salaires & charges", "account", "641\u2026648", "D-C"],
              ["PL_180", "EBITDA (EBE)", "subtotal", "formule", "formule"],
              ["PL_240", "EBIT (R\u00e9sultat expl.)", "subtotal", "formule", "formule"],
              ["PL_340", "R\u00e9sultat net", "subtotal", "formule", "formule"],
              ["PL_900", "Contr\u00f4le 12x", "account", "120, 129", "C-D"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 1200, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 3300, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 1560, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[3], 1800, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[4], 1500, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),
        spacer(),
        para([italic("C-D = credit_minus_debit (produits). D-C = debit_minus_credit (charges). Formule = r\u00e9f\u00e9rence \u00e0 d\u2019autres lignes PL_xxx.")]),

        heading("3.3 Table BFR (35 lignes)", HeadingLevel.HEADING_2),
        para("Cat\u00e9gories : actif circulant op\u00e9rationnel, passif circulant op\u00e9rationnel, hors exploitation, tr\u00e9sorerie, dette financi\u00e8re. Chaque ligne a un ratio li\u00e9 (DSO, DPO, DIO) pour le rapprochement KPI."),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [1200, 3000, 2400, 1560, 1200],
          rows: [
            new TableRow({ children: [
              headerCell("ID", 1200), headerCell("Libell\u00e9", 3000), headerCell("Cat\u00e9gorie", 2400),
              headerCell("M\u00e9thode", 1560), headerCell("Ratio", 1200),
            ]}),
            ...([
              ["BFR_010", "Cr\u00e9ances clients", "operating_asset", "D-C", "DSO"],
              ["BFR_020", "Stocks MP", "operating_asset", "D-C", "DIO"],
              ["BFR_110", "Dettes fournisseurs", "operating_liability", "C-D", "DPO"],
              ["BFR_200", "Total actif op.", "subtotal", "formule", "\u2014"],
              ["BFR_210", "Total passif op.", "subtotal", "formule", "\u2014"],
              ["BFR_220", "BFR Op\u00e9rationnel", "subtotal", "BFR_200-210", "\u2014"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 1200, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 3000, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 2400, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[3], 1560, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[4], 1200, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),

        heading("3.4 Table P&L Anglo-Saxon (17 lignes)", HeadingLevel.HEADING_2),
        para("Reclassification du SIG fran\u00e7ais en format M&A international. Chaque ligne r\u00e9f\u00e9rence des PL_xxx avec un multiplicateur de signe (+1/-1)."),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [1200, 2800, 2800, 1560, 1000],
          rows: [
            new TableRow({ children: [
              headerCell("ID", 1200), headerCell("Label EN", 2800), headerCell("Label FR", 2800),
              headerCell("Type", 1560), headerCell("Key", 1000),
            ]}),
            ...([
              ["AS_010", "Revenue", "Chiffre d\u2019affaires", "source", "Oui"],
              ["AS_020", "COGS", "Co\u00fbt des ventes", "source", "Non"],
              ["AS_030", "Gross Margin", "Marge brute", "subtotal", "Oui"],
              ["AS_040", "Personnel costs", "Frais de personnel", "source", "Non"],
              ["AS_070", "EBITDA", "EBE", "subtotal", "Oui"],
              ["AS_100", "EBIT", "R\u00e9sultat d\u2019exploitation", "subtotal", "Oui"],
              ["AS_120", "EBT", "R\u00e9sultat avant imp\u00f4t", "subtotal", "Oui"],
              ["AS_160", "Net Income", "R\u00e9sultat net", "subtotal", "Oui"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 1200, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 2800, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 2800, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[3], 1560, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[4], 1000, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),

        heading("3.5 Table KPI (19 lignes)", HeadingLevel.HEADING_2),
        para("KPIs calcul\u00e9s par formules arithm\u00e9tiques r\u00e9f\u00e9ren\u00e7ant PL_xxx et BFR_xxx. Filtr\u00e9s par secteur d\u2019activit\u00e9."),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [1200, 3000, 2160, 1500, 1500],
          rows: [
            new TableRow({ children: [
              headerCell("ID", 1200), headerCell("Nom", 3000), headerCell("Cat\u00e9gorie", 2160),
              headerCell("Unit\u00e9", 1500), headerCell("Secteurs", 1500),
            ]}),
            ...([
              ["KPI_010", "Marge commerciale stricte", "profitability", "%", "Distri, Indus"],
              ["KPI_020", "Taux de valeur ajout\u00e9e", "profitability", "%", "Tous"],
              ["KPI_050", "Poids masse salariale", "profitability", "%", "Tous"],
              ["KPI_070", "DSO (cr\u00e9ances clients)", "activity", "jours", "Tous"],
              ["KPI_080", "DIO (stocks)", "activity", "jours", "Distri, Indus"],
              ["KPI_090", "DPO (fournisseurs)", "activity", "jours", "Tous"],
              ["KPI_100", "Levier d\u2019endettement", "leverage", "multiple", "Tous"],
              ["KPI_130", "Couverture d\u2019int\u00e9r\u00eats", "coverage", "multiple", "Tous"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 1200, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 3000, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 2160, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[3], 1500, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[4], 1500, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),
        spacer(),
        para([italic("Chaque KPI a des seuils d\u2019alerte (alert_below / alert_above) et un benchmark de r\u00e9f\u00e9rence.")]),

        // ── 4. MOTEUR DE CALCUL ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("4. Moteur de calcul (engine.ts)"),
        para("Le moteur (729 lignes, 6 fonctions export\u00e9es) transforme les \u00e9critures brutes en r\u00e9sultats structur\u00e9s. Il est purement d\u00e9terministe, sans \u00e9tat, et ex\u00e9cut\u00e9 enti\u00e8rement c\u00f4t\u00e9 client (pas de backend compute)."),

        heading("4.1 Algorithme de matching comptable", HeadingLevel.HEADING_2),
        para([
          bold("Longest-prefix-first matching"),
          new TextRun(" : pour chaque \u00e9criture, le moteur parcourt toutes les lignes de mapping et retient celle dont le pr\u00e9fixe PCG est le plus long match. Cela \u00e9vite les ambigu\u00eft\u00e9s (ex : 4010 match 401 plut\u00f4t que 40). Les exclusions sont v\u00e9rifi\u00e9es avant validation du match."),
        ]),

        heading("4.2 Conventions de signe", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("credit_minus_debit "), new TextRun("(produits, classe 7) : montant = \u03a3 cr\u00e9dit - \u03a3 d\u00e9bit"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("debit_minus_credit "), new TextRun("(charges, classe 6) : montant = \u03a3 d\u00e9bit - \u03a3 cr\u00e9dit"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("formula "), new TextRun("(sous-totaux) : \u00e9valuation d\u2019expressions type \u00ab PL_010 - PL_012 + PL_020 \u00bb"),
        ]}),

        heading("4.3 Pipeline de calcul", HeadingLevel.HEADING_2),
        para([bold("computePnl(entries)")]),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Filtrage : exclusion journaux AN/RAN, comptes 12x/89x, traitement sp\u00e9cial cl\u00f4ture")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Classification : chaque \u00e9criture associ\u00e9e \u00e0 sa ligne PL_xxx via longest-prefix")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Agr\u00e9gation : somme d\u00e9bit/cr\u00e9dit par ligne + d\u00e9tail par compte")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Application convention de signe \u2192 montant par ligne")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("\u00c9valuation formules sous-totaux (2 passes : comptes puis formules)")] }),
        spacer(),

        para([bold("computeMonthlyBfr(entries)")]),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Int\u00e8gre TOUTES les \u00e9critures (y compris AN/RAN, pour soldes cumulatifs)")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Pour chaque mois : solde cumulatif = \u03a3 \u00e9critures de date \u2264 fin de mois")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Cat\u00e9gorisation : actif op\u00e9rationnel, passif op\u00e9rationnel, hors exploitation, tr\u00e9sorerie")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Sous-totaux mensuels : BFR op\u00e9rationnel = actifs - passifs")] }),
        spacer(),

        para([bold("computeAngloSaxonPnl(sigPnl, mapping)")]),
        para("Prend les r\u00e9sultats SIG d\u00e9j\u00e0 calcul\u00e9s et les reclassifie via la table AS_xxx. Les source_signs (+1/-1) permettent d\u2019inverser le signe des charges. Les d\u00e9tails et \u00e9critures sont fusionn\u00e9s depuis les lignes PL source."),
        spacer(),

        para([bold("computeKpis(pnl, bfr, sector)")]),
        para("Construit une Map unifi\u00e9e {PL_xxx \u2192 montant, BFR_xxx \u2192 solde dernier mois}. Filtre les KPIs par sector_relevance. \u00c9value chaque formule via Function constructor (safe : mapping-only, pas d\u2019input utilisateur). D\u00e9tecte les alertes si valeur hors seuils."),

        heading("4.4 \u00c9valuateur de formules", HeadingLevel.HEADING_2),
        para("Deux \u00e9valuateurs coexistent :"),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("evaluateFormula() "), new TextRun("(P&L/BFR) : tokenisation regex, arithm\u00e9tique simple +/-"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("evaluateKpiFormula() "), new TextRun("(KPIs) : remplacement d\u2019IDs puis new Function() pour supporter *, /, parenth\u00e8ses"),
        ]}),
        para([italic("S\u00e9curit\u00e9 : seules les formules du mapping (code source) sont \u00e9valu\u00e9es, jamais d\u2019input utilisateur.")]),

        // ── 5. MULTI-EXERCICES ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("5. Architecture multi-exercices"),
        para("Chaque soci\u00e9t\u00e9 peut avoir N fichiers FEC (un par exercice fiscal). L\u2019analyse de chaque exercice est ind\u00e9pendante ; la comparaison est effectu\u00e9e uniquement dans la couche d\u2019affichage."),

        heading("5.1 Mod\u00e8le de donn\u00e9es", HeadingLevel.HEADING_2),
        para([
          mono("Company.fecFiles: FecYearFile[]"),
          new TextRun(" \u2014 chaque entr\u00e9e contient l\u2019ann\u00e9e fiscale (number), le fichier, les entr\u00e9es pars\u00e9es, et l\u2019\u00e9tat d\u2019erreur."),
        ]),
        spacer(),
        para([
          mono("MultiYearAnalysisResult.yearResults: AnalysisResult[]"),
          new TextRun(" \u2014 tableau tri\u00e9 chronologiquement (ann\u00e9e croissante), chaque AnalysisResult est le m\u00eame objet qu\u2019en mono-exercice."),
        ]),

        heading("5.2 Flux de traitement", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("L\u2019utilisateur ajoute des slots exercice (FY 2023, FY 2024, FY 2025)")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Pour chaque slot, il glisse le FEC correspondant")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("L\u2019ann\u00e9e est auto-d\u00e9tect\u00e9e depuis les dates des \u00e9critures (modifiable manuellement)")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("analyzeCompanyMultiYear() it\u00e8re sur les fichiers tri\u00e9s par ann\u00e9e")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Chaque fichier est analys\u00e9 ind\u00e9pendamment via analyzeEntries()")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Les r\u00e9sultats sont empaquett\u00e9s dans un MultiYearAnalysisResult")] }),

        heading("5.3 Affichage comparatif", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("P&L (SIG + M&A) : "), new TextRun("colonnes par exercice + colonnes Var \u20ac et Var % (N vs N-1)"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("BFR : "), new TextRun("barres group\u00e9es par mois (01-12), une couleur par exercice (zinc-300 \u2192 zinc-900)"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("KPIs : "), new TextRun("valeur ann\u00e9e la plus r\u00e9cente + delta N/N-1 avec fl\u00e8ches TrendingUp/Down"),
        ]}),

        // ── 6. OUTPUTS PRODUITS ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("6. Outputs produits"),

        heading("6.1 P&L SIG d\u00e9taill\u00e9", HeadingLevel.HEADING_2),
        para("Compte de r\u00e9sultat fran\u00e7ais adapt\u00e9 M&A, structur\u00e9 en Soldes Interm\u00e9diaires de Gestion. 65 lignes avec s\u00e9parateurs visuels, sous-totaux cl\u00e9s en gras (CA, VA, EBITDA, EBIT, RN), badges de retraitement (Dir., IFRS16, One-off, IC, CIR, CAPEX, CVAE)."),
        para([bold("Drill-down : "), new TextRun("clic sur une ligne de type \u00ab account \u00bb \u2192 modale avec d\u00e9tail par compte comptable (num\u00e9ro, libell\u00e9, d\u00e9bit, cr\u00e9dit, solde).")]),
        para([bold("Contr\u00f4le : "), new TextRun("v\u00e9rification automatique RN calcul\u00e9 vs solde 12x. Alerte si \u00e9cart, avec explication (normal si FEC avant affectation du r\u00e9sultat).")]),

        heading("6.2 P&L M&A anglo-saxon", HeadingLevel.HEADING_2),
        para("Reclassification en 17 lignes : Revenue \u2192 COGS \u2192 Gross Margin \u2192 EBITDA \u2192 EBIT \u2192 EBT \u2192 Net Income. Labels bilingues EN/FR. Sous-totaux cl\u00e9s en gras fond gris."),
        para([bold("Drill-down avanc\u00e9 : "), new TextRun("clic sur n\u2019importe quelle ligne \u2192 LedgerModal avec les \u00e9critures journal individuelles (date, journal, pi\u00e8ce, compte, libell\u00e9, d\u00e9bit, cr\u00e9dit). Permet l\u2019audit complet de chaque agr\u00e9gat.")]),

        heading("6.3 BFR op\u00e9rationnel mensuel", HeadingLevel.HEADING_2),
        para("Histogramme Recharts avec solde BFR op\u00e9rationnel par mois. Barres noires (positif) / rouges (n\u00e9gatif). Tooltip d\u00e9taill\u00e9 (actif/passif/BFR). Stats synth\u00e8se : min/moyen/max."),
        para([bold("Drill-down structur\u00e9 : "), new TextRun("clic sur une barre \u2192 BfrDetailModal organis\u00e9 en 4 cat\u00e9gories (Actif circulant op., Passif circulant op., Hors exploitation, Tr\u00e9sorerie). Chaque ligne est d\u00e9pliable pour voir les comptes sous-jacents.")]),

        heading("6.4 KPIs sectoriels", HeadingLevel.HEADING_2),
        para("19 KPIs organis\u00e9s par cat\u00e9gorie (Profitabilit\u00e9, Activit\u00e9/BFR, Endettement, Couverture). Filtr\u00e9s par secteur (ESN, BTP, Industrie, Software, Distribution). Chaque carte affiche la valeur, le benchmark de r\u00e9f\u00e9rence, et un badge d\u2019alerte si hors seuil."),

        // ── 7. ARBRE DES FICHIERS ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("7. Inventaire des fichiers"),
        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          columnWidths: [3600, 1200, 2160, 2400],
          rows: [
            new TableRow({ children: [
              headerCell("Fichier", 3600), headerCell("Lignes", 1200), headerCell("Type", 2160), headerCell("R\u00f4le", 2400),
            ]}),
            ...([
              ["lib/fec/types.ts", "255", "Interfaces", "D\u00e9finitions TypeScript"],
              ["lib/fec/parser.ts", "323", "Logique", "Parsing FEC DGFiP"],
              ["lib/fec/mapping.ts", "1 680", "Data (JSON)", "4 tables de mapping"],
              ["lib/fec/engine.ts", "729", "Logique", "Moteur de calcul"],
              ["lib/fec/format.ts", "93", "Utilitaires", "11 formateurs FR"],
              ["components/fec/", "12 fichiers", "UI (React)", "Interface utilisateur"],
              ["lib/supabase/", "4 fichiers", "Config", "Clients Supabase"],
              ["middleware.ts", "~80", "S\u00e9curit\u00e9", "Auth + NDA enforcement"],
            ].map((r, i) => new TableRow({ children: [
              cell(r[0], 3600, { bold: true, shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[1], 1200, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[2], 2160, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
              cell(r[3], 2400, { shade: i % 2 === 0 ? "f4f4f5" : undefined }),
            ]}))),
          ],
        }),
        spacer(),
        para([bold("Total module FEC : ~3 080 lignes de code"), new TextRun(" (hors composants UI et shadcn/ui).")]),

        // ── 8. SÉCURITÉ ──
        heading("8. S\u00e9curit\u00e9 et conformit\u00e9"),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Aucune donn\u00e9e FEC ne transite par le serveur "), new TextRun(": parsing et calcul 100% client-side"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Pas de persistence des FEC "), new TextRun(": les donn\u00e9es vivent en m\u00e9moire React, perdues \u00e0 la fermeture"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("RLS Supabase "), new TextRun(": chaque utilisateur ne voit que ses propres donn\u00e9es"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("NDA obligatoire "), new TextRun(": signature requise avant tout acc\u00e8s, avec tra\u00e7abilit\u00e9 (IP, user-agent, version)"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          bold("Formula evaluation "), new TextRun(": Function() utilis\u00e9 uniquement sur des formules du mapping (code source), jamais sur de l\u2019input utilisateur"),
        ]}),

        spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "\u2014 Fin du document \u2014", size: 20, color: "a1a1aa", italics: true })],
        }),
      ],
    },
  ],
});

// Generate
Packer.toBuffer(doc).then((buffer) => {
  const path = process.cwd() + "/M&A_OS_Portal_Audit_Technique.docx";
  fs.writeFileSync(path, buffer);
  console.log("Generated:", path, `(${(buffer.length / 1024).toFixed(0)} KB)`);
});
