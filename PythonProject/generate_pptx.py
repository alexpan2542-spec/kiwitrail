"""Generate the Kiwi Trail project presentation as a .pptx file."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN


# Kiwi-inspired color palette
NZ_GREEN = RGBColor(0x1B, 0x5E, 0x20)        # deep forest green
NZ_GREEN_LIGHT = RGBColor(0x4C, 0xAF, 0x50)  # accent green
NZ_BROWN = RGBColor(0x5D, 0x40, 0x37)        # earthy brown
NZ_SKY = RGBColor(0x29, 0x79, 0xB5)          # sky / lake blue
TEXT_DARK = RGBColor(0x21, 0x21, 0x21)
TEXT_LIGHT = RGBColor(0xFA, 0xFA, 0xFA)
BG_LIGHT = RGBColor(0xF5, 0xF7, 0xF2)
BG_CARD = RGBColor(0xFF, 0xFF, 0xFF)


def add_background(slide, color):
    """Fill the slide background with a solid colour."""
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    # Send to back
    spTree = bg._element.getparent()
    spTree.remove(bg._element)
    spTree.insert(2, bg._element)
    return bg


def add_side_band(slide, color, width=Inches(0.35)):
    """Add a vertical colour band along the left edge."""
    band = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, width, prs.slide_height
    )
    band.fill.solid()
    band.fill.fore_color.rgb = color
    band.line.fill.background()
    return band


def add_footer(slide, text="Kiwi Trail  |  570 Programming Project"):
    """Add a footer line at the bottom of the slide."""
    box = slide.shapes.add_textbox(
        Inches(0.5), Inches(7.0), Inches(12.0), Inches(0.35)
    )
    tf = box.text_frame
    tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = text
    run.font.size = Pt(10)
    run.font.color.rgb = NZ_GREEN
    run.font.italic = True


def add_title(slide, text, top=Inches(0.4), color=NZ_GREEN, size=32):
    """Add a styled slide title."""
    box = slide.shapes.add_textbox(
        Inches(0.7), top, Inches(12.0), Inches(0.9)
    )
    tf = box.text_frame
    tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = True
    run.font.color.rgb = color

    # Underline accent
    underline = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.72), top + Inches(0.85),
        Inches(1.0), Inches(0.06),
    )
    underline.fill.solid()
    underline.fill.fore_color.rgb = NZ_GREEN_LIGHT
    underline.line.fill.background()
    return box


def add_bullets(slide, items, left=Inches(0.9), top=Inches(1.55),
                width=Inches(11.5), height=Inches(5.2),
                font_size=20, color=TEXT_DARK, bullet_color=NZ_GREEN_LIGHT):
    """Add a bulleted list with custom round bullets."""
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)

    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(8)

        bullet_run = p.add_run()
        bullet_run.text = "●  "
        bullet_run.font.size = Pt(font_size)
        bullet_run.font.color.rgb = bullet_color
        bullet_run.font.bold = True

        text_run = p.add_run()
        text_run.text = item
        text_run.font.size = Pt(font_size)
        text_run.font.color.rgb = color
    return box


def add_speaker_note(slide, note):
    """Add speaker notes to a slide."""
    notes_tf = slide.notes_slide.notes_text_frame
    notes_tf.text = note


def add_card(slide, left, top, width, height, title, items,
             title_color=NZ_GREEN, title_size=18, body_size=14):
    """Add a rounded card with a title and a list of items."""
    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    card.fill.solid()
    card.fill.fore_color.rgb = BG_CARD
    card.line.color.rgb = NZ_GREEN_LIGHT
    card.line.width = Pt(1.25)
    card.shadow.inherit = False

    tf = card.text_frame
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.15)
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title
    run.font.bold = True
    run.font.size = Pt(title_size)
    run.font.color.rgb = title_color

    for item in items:
        para = tf.add_paragraph()
        para.alignment = PP_ALIGN.LEFT
        para.space_before = Pt(4)
        bullet = para.add_run()
        bullet.text = "•  "
        bullet.font.size = Pt(body_size)
        bullet.font.color.rgb = NZ_GREEN_LIGHT
        bullet.font.bold = True
        body = para.add_run()
        body.text = item
        body.font.size = Pt(body_size)
        body.font.color.rgb = TEXT_DARK
    return card


def base_slide():
    """Create a blank slide with the standard styling (background + band + footer)."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    add_background(slide, BG_LIGHT)
    add_side_band(slide, NZ_GREEN)
    add_footer(slide)
    return slide


# ---------------------------------------------------------------------------
# Build the presentation
# ---------------------------------------------------------------------------

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)


# ---------------------------------------------------------------------------
# Slide 1 — Title
# ---------------------------------------------------------------------------
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, NZ_GREEN)

# Decorative shapes
circle = slide.shapes.add_shape(
    MSO_SHAPE.OVAL, Inches(-2), Inches(-2), Inches(5), Inches(5)
)
circle.fill.solid()
circle.fill.fore_color.rgb = NZ_GREEN_LIGHT
circle.line.fill.background()

circle2 = slide.shapes.add_shape(
    MSO_SHAPE.OVAL, Inches(10), Inches(4.5), Inches(6), Inches(6)
)
circle2.fill.solid()
circle2.fill.fore_color.rgb = NZ_BROWN
circle2.line.fill.background()

# Title
box = slide.shapes.add_textbox(Inches(0.8), Inches(2.0), Inches(11.7), Inches(1.5))
tf = box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
run = p.add_run()
run.text = "Kiwi Trail"
run.font.size = Pt(80)
run.font.bold = True
run.font.color.rgb = TEXT_LIGHT

# Project tag line
box = slide.shapes.add_textbox(Inches(0.85), Inches(3.3), Inches(11.5), Inches(0.6))
tf = box.text_frame
p = tf.paragraphs[0]
run = p.add_run()
run.text = "570 Programming Project"
run.font.size = Pt(26)
run.font.color.rgb = NZ_GREEN_LIGHT
run.font.bold = True

# Subtitle
box = slide.shapes.add_textbox(Inches(0.85), Inches(4.0), Inches(11.5), Inches(0.8))
tf = box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
run = p.add_run()
run.text = "A web application for planning outdoor activities in New Zealand"
run.font.size = Pt(22)
run.font.color.rgb = TEXT_LIGHT
run.font.italic = True

# Accent line
accent = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, Inches(0.85), Inches(4.9), Inches(2.0), Inches(0.08)
)
accent.fill.solid()
accent.fill.fore_color.rgb = NZ_GREEN_LIGHT
accent.line.fill.background()

# Name / date placeholder
box = slide.shapes.add_textbox(Inches(0.85), Inches(5.2), Inches(11.5), Inches(1.5))
tf = box.text_frame
tf.word_wrap = True
for line in ["Name / Team: [Your name / team name]",
             "Date: [Presentation date]"]:
    p = tf.add_paragraph() if line != "Name / Team: [Your name / team name]" else tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = line
    run.font.size = Pt(18)
    run.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "Today I will introduce Kiwi Trail, a web application designed to help "
    "New Zealand locals and visitors find hiking tracks, huts, campsites, "
    "and outdoor destinations more easily."
)


# ---------------------------------------------------------------------------
# Slide 2 — Problem Statement
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Problem Statement")

intro = slide.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.5))
tf = intro.text_frame
p = tf.paragraphs[0]
run = p.add_run()
run.text = "New Zealand has many outdoor places such as:"
run.font.size = Pt(20)
run.font.color.rgb = TEXT_DARK

add_bullets(
    slide,
    [
        "Hiking tracks",
        "Huts",
        "Campsites",
        "Regional parks and outdoor areas",
    ],
    top=Inches(2.1),
    font_size=20,
)

# Problem callout card
card = slide.shapes.add_shape(
    MSO_SHAPE.ROUNDED_RECTANGLE,
    Inches(0.9), Inches(4.5), Inches(11.5), Inches(2.2),
)
card.fill.solid()
card.fill.fore_color.rgb = NZ_GREEN
card.line.fill.background()

tf = card.text_frame
tf.margin_left = Inches(0.3)
tf.margin_top = Inches(0.2)
tf.word_wrap = True
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Problem"
run.font.bold = True
run.font.size = Pt(22)
run.font.color.rgb = TEXT_LIGHT

p = tf.add_paragraph()
p.space_before = Pt(8)
run = p.add_run()
run.text = (
    "Information about outdoor places is often spread across different datasets "
    "and websites. Users need a convenient way to search, filter, view, and plan "
    "outdoor activities using local New Zealand data."
)
run.font.size = Pt(18)
run.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "The main issue this project solves is that outdoor activity data exists, "
    "but users may need to visit different sources to find tracks, huts, "
    "campsites, locations, maps, and weather information."
)


# ---------------------------------------------------------------------------
# Slide 3 — Project Objective
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Project Objective")

intro = slide.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.6))
tf = intro.text_frame
p = tf.paragraphs[0]
run = p.add_run()
run.text = "The objective of Kiwi Trail is to build a web application that helps:"
run.font.size = Pt(20)
run.font.color.rgb = TEXT_DARK

add_bullets(
    slide,
    [
        "Kiwis plan hiking and camping activities",
        "Visitors explore outdoor places in New Zealand",
        "Users find nearby tracks, huts, and campsites",
        "Users view details, maps, directions, and weather information",
    ],
    top=Inches(2.3),
    font_size=22,
)

# Goal callout
goal = slide.shapes.add_shape(
    MSO_SHAPE.ROUNDED_RECTANGLE,
    Inches(0.9), Inches(5.7), Inches(11.5), Inches(1.0),
)
goal.fill.solid()
goal.fill.fore_color.rgb = NZ_SKY
goal.line.fill.background()
tf = goal.text_frame
tf.margin_left = Inches(0.3)
tf.margin_top = Inches(0.15)
tf.word_wrap = True
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Goal: "
run.font.bold = True
run.font.size = Pt(18)
run.font.color.rgb = TEXT_LIGHT
run2 = p.add_run()
run2.text = (
    "Make outdoor planning easier, faster, and more convenient by combining "
    "local datasets into one web application."
)
run2.font.size = Pt(18)
run2.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "The goal is to make outdoor planning easier, faster, and more convenient "
    "by combining local datasets into one web application."
)


# ---------------------------------------------------------------------------
# Slide 4 — Proposed Solution
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Proposed Solution")

intro = slide.shapes.add_textbox(Inches(0.9), Inches(1.45), Inches(11.5), Inches(0.5))
tf = intro.text_frame
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Kiwi Trail is a map-based web application where users can:"
run.font.size = Pt(18)
run.font.color.rgb = TEXT_DARK

# Two columns of bullets
left_items = [
    "Select a region",
    "Choose hiking difficulty",
    "Filter tracks, huts, and campsites",
    "Search places using fuzzy search",
    "View nearby items within 15 km",
]
right_items = [
    "Check item details",
    "Open Google Maps navigation",
    "View weather forecasts",
    "Add comments",
    "Save favourite places",
]

add_bullets(slide, left_items,
            left=Inches(0.9), top=Inches(2.1),
            width=Inches(5.7), height=Inches(4.5), font_size=18)
add_bullets(slide, right_items,
            left=Inches(6.9), top=Inches(2.1),
            width=Inches(5.7), height=Inches(4.5), font_size=18)

add_speaker_note(
    slide,
    "The solution is a user-friendly website that combines outdoor activity "
    "data with interactive map features and practical planning tools."
)


# ---------------------------------------------------------------------------
# Slide 5 — System Architecture
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "System Architecture")

# Left column: stack description
add_card(
    slide,
    Inches(0.9), Inches(1.5),
    Inches(5.6), Inches(2.5),
    "Technology Stack",
    [
        "Frontend: React",
        "Backend: FastAPI",
        "Database: PostgreSQL",
    ],
    title_size=20,
    body_size=16,
)

add_card(
    slide,
    Inches(0.9), Inches(4.2),
    Inches(5.6), Inches(2.6),
    "Data Sources",
    [
        "DOC datasets: tracks, huts, campsites",
        "LINZ datasets: tile map and gazetteer",
        "Region boundary data",
        "NIWA weather widget",
    ],
    title_size=20,
    body_size=16,
)

# Right column: simple architecture diagram
diagram_left = Inches(7.2)
diagram_top = Inches(1.5)
diagram_width = Inches(5.4)
diagram_height = Inches(5.3)


def diagram_box(left, top, width, height, label, fill, text_color=TEXT_LIGHT,
                shape=MSO_SHAPE.ROUNDED_RECTANGLE, font_size=14):
    s = slide.shapes.add_shape(shape, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    tf = s.text_frame
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    run.font.bold = True
    run.font.size = Pt(font_size)
    run.font.color.rgb = text_color
    return s


layer_height = Inches(0.7)
gap = Inches(0.2)
layer_width = Inches(4.0)
layer_left = diagram_left + (diagram_width - layer_width) / 2

layers = [
    ("User", NZ_BROWN),
    ("React Frontend", NZ_GREEN_LIGHT),
    ("FastAPI Backend", NZ_SKY),
    ("PostgreSQL Database", NZ_GREEN),
    ("DOC / LINZ / Region / Weather Data", NZ_BROWN),
]
y = diagram_top + Inches(0.2)
prev_bottom = None
for label, color in layers:
    box = diagram_box(layer_left, y, layer_width, layer_height, label, color,
                      font_size=15)
    if prev_bottom is not None:
        connector = slide.shapes.add_shape(
            MSO_SHAPE.DOWN_ARROW,
            layer_left + layer_width / 2 - Inches(0.12),
            prev_bottom,
            Inches(0.24),
            gap,
        )
        connector.fill.solid()
        connector.fill.fore_color.rgb = NZ_GREEN
        connector.line.fill.background()
    prev_bottom = y + layer_height
    y = prev_bottom + gap

add_speaker_note(
    slide,
    "The system uses React for the user interface, FastAPI for backend APIs, "
    "and PostgreSQL to store imported track, hut, campsite, and region data."
)


# ---------------------------------------------------------------------------
# Slide 6 — Data Workflow
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Data Workflow")

steps = [
    "Collect NZ local datasets",
    "Clean & prepare data",
    "Import into PostgreSQL",
    "Backend exposes APIs",
    "Frontend shows on map",
    "Users search & plan",
]

# Two rows of three step cards
step_w = Inches(3.9)
step_h = Inches(2.0)
gap_x = Inches(0.25)
gap_y = Inches(0.4)
start_left = Inches(0.9)
start_top = Inches(1.7)

colors = [NZ_GREEN, NZ_GREEN_LIGHT, NZ_SKY, NZ_BROWN, NZ_GREEN_LIGHT, NZ_GREEN]

for i, (text, color) in enumerate(zip(steps, colors)):
    row = i // 3
    col = i % 3
    left = start_left + col * (step_w + gap_x)
    top = start_top + row * (step_h + gap_y)

    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, step_w, step_h
    )
    card.fill.solid()
    card.fill.fore_color.rgb = color
    card.line.fill.background()

    # Step number circle
    num = slide.shapes.add_shape(
        MSO_SHAPE.OVAL,
        left + Inches(0.2), top + Inches(0.2),
        Inches(0.6), Inches(0.6),
    )
    num.fill.solid()
    num.fill.fore_color.rgb = TEXT_LIGHT
    num.line.fill.background()
    tf = num.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = str(i + 1)
    run.font.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = color

    # Step description
    txt = slide.shapes.add_textbox(
        left + Inches(0.2),
        top + Inches(0.95),
        step_w - Inches(0.4),
        step_h - Inches(1.0),
    )
    tf = txt.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = text
    run.font.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "The application depends on data processing. After importing local "
    "datasets into the database, the backend makes this data available "
    "to the frontend."
)


# ---------------------------------------------------------------------------
# Slide 7 — Key Features
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Key Features")

features = [
    "Region selection",
    "Hiking difficulty filter",
    "Track / hut / campsite filtering",
    "Fuzzy search",
    "Nearby results within 15 km",
    "Interactive map display",
    "Detail page for each item",
    "Google Maps directions",
    "Weather forecast widget",
    "User comments",
    "Favourite item saving",
    "User-friendly experience",
]

# 3-column grid of feature pills
cols = 3
rows = 4
pill_w = Inches(3.9)
pill_h = Inches(1.05)
gap_x = Inches(0.25)
gap_y = Inches(0.2)
start_left = Inches(0.9)
start_top = Inches(1.65)

colors_cycle = [NZ_GREEN, NZ_GREEN_LIGHT, NZ_SKY, NZ_BROWN]

for i, text in enumerate(features):
    row = i // cols
    col = i % cols
    left = start_left + col * (pill_w + gap_x)
    top = start_top + row * (pill_h + gap_y)
    color = colors_cycle[row % len(colors_cycle)]

    pill = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, pill_w, pill_h
    )
    pill.fill.solid()
    pill.fill.fore_color.rgb = BG_CARD
    pill.line.color.rgb = color
    pill.line.width = Pt(1.5)

    # Left accent bar
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        left, top, Inches(0.18), pill_h,
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()

    tf = pill.text_frame
    tf.margin_left = Inches(0.3)
    tf.margin_right = Inches(0.1)
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = text
    run.font.bold = True
    run.font.size = Pt(15)
    run.font.color.rgb = TEXT_DARK

add_speaker_note(
    slide,
    "These features are designed to support the full planning process, from "
    "searching for a place to checking details, weather, and navigation."
)


# ---------------------------------------------------------------------------
# Slide 8 — Implementation Details
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Implementation Details")

card_w = Inches(4.0)
card_h = Inches(5.0)
card_top = Inches(1.7)
gap = Inches(0.2)

add_card(
    slide,
    Inches(0.9), card_top, card_w, card_h,
    "Frontend (React)",
    [
        "Map display",
        "Search bar",
        "Filter panel",
        "Item detail view",
        "Comment section",
        "Favourite list",
    ],
    title_size=18,
    body_size=15,
)

add_card(
    slide,
    Inches(0.9) + card_w + gap, card_top, card_w, card_h,
    "Backend (FastAPI)",
    [
        "API routes for tracks, huts, campsites",
        "Region and difficulty filtering",
        "Nearby location search",
        "User comment handling",
        "Favourite handling",
    ],
    title_size=18,
    body_size=15,
)

add_card(
    slide,
    Inches(0.9) + 2 * (card_w + gap), card_top, card_w, card_h,
    "Database (PostgreSQL)",
    [
        "Tracks",
        "Huts",
        "Campsites",
        "Regions",
        "Users",
        "Comments",
        "Favourites",
    ],
    title_size=18,
    body_size=15,
)

add_speaker_note(
    slide,
    "The project is divided into frontend, backend, and database modules. "
    "Each part has a clear role in supporting the user experience."
)


# ---------------------------------------------------------------------------
# Slide 9 — Results / Demo
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Results / Demo")

# Left: capabilities list
add_bullets(
    slide,
    [
        "Display outdoor locations on a map",
        "Filter places by region and difficulty",
        "Search outdoor items",
        "Show nearby results",
        "Display item details",
        "Redirect users to Google Maps",
        "Show weather forecasts",
        "Support comments and favourites",
    ],
    left=Inches(0.9), top=Inches(1.6),
    width=Inches(6.0), height=Inches(5.2),
    font_size=16,
)

# Right: screenshot placeholder grid
ph_left = Inches(7.2)
ph_top = Inches(1.6)
ph_w = Inches(2.6)
ph_h = Inches(1.55)
gap_x = Inches(0.2)
gap_y = Inches(0.2)

labels = [
    "Home page",
    "Map page",
    "Search / filter",
    "Detail page",
    "Favourites / comments",
    "Weather widget",
]

for idx, label in enumerate(labels):
    row = idx // 2
    col = idx % 2
    left = ph_left + col * (ph_w + gap_x)
    top = ph_top + row * (ph_h + gap_y)

    ph = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, ph_w, ph_h
    )
    ph.fill.solid()
    ph.fill.fore_color.rgb = BG_CARD
    ph.line.color.rgb = NZ_GREEN_LIGHT
    ph.line.width = Pt(1.25)
    ph.line.dash_style = 7  # dashed

    tf = ph.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = "[ Screenshot ]"
    run.font.size = Pt(12)
    run.font.color.rgb = NZ_GREEN
    run.font.italic = True

    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(4)
    run = p2.add_run()
    run.text = label
    run.font.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = TEXT_DARK

add_speaker_note(
    slide,
    "In this slide, I would demonstrate the website and show how a user can "
    "search for a hiking track, check details, view weather, and navigate to "
    "the destination. (Add screenshots in the placeholders.)"
)


# ---------------------------------------------------------------------------
# Slide 10 — Challenges & Solutions
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Challenges & Solutions")

challenges = [
    ("Combining data from multiple sources",
     "Cleaned and imported data into PostgreSQL with a consistent structure.",
     NZ_GREEN),
    ("Displaying geographic data on a map",
     "Used map tiles and location data to show tracks, huts, and campsites visually.",
     NZ_SKY),
    ("Helping users find relevant places quickly",
     "Added filters, fuzzy search, and nearby search within 15 km.",
     NZ_GREEN_LIGHT),
    ("Improving user planning experience",
     "Added Google Maps directions, weather forecast, comments, and favourites.",
     NZ_BROWN),
]

card_w = Inches(5.9)
card_h = Inches(2.45)
gap_x = Inches(0.25)
gap_y = Inches(0.2)
start_left = Inches(0.9)
start_top = Inches(1.6)

for i, (chal, sol, color) in enumerate(challenges):
    row = i // 2
    col = i % 2
    left = start_left + col * (card_w + gap_x)
    top = start_top + row * (card_h + gap_y)

    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h
    )
    card.fill.solid()
    card.fill.fore_color.rgb = BG_CARD
    card.line.color.rgb = color
    card.line.width = Pt(1.5)

    # Coloured header strip
    strip = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, card_w, Inches(0.55)
    )
    strip.fill.solid()
    strip.fill.fore_color.rgb = color
    strip.line.fill.background()

    head_tf = strip.text_frame
    head_tf.margin_left = Inches(0.2)
    head_tf.margin_top = Inches(0.05)
    p = head_tf.paragraphs[0]
    run = p.add_run()
    run.text = f"Challenge {i + 1}: {chal}"
    run.font.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = TEXT_LIGHT

    # Solution body
    body = slide.shapes.add_textbox(
        left + Inches(0.2),
        top + Inches(0.7),
        card_w - Inches(0.4),
        card_h - Inches(0.8),
    )
    tf = body.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = "Solution: "
    run.font.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = color
    run2 = p.add_run()
    run2.text = sol
    run2.font.size = Pt(14)
    run2.font.color.rgb = TEXT_DARK

add_speaker_note(
    slide,
    "The main challenges were related to data integration, geographic "
    "display, and user experience. Each feature was designed to make outdoor "
    "planning easier."
)


# ---------------------------------------------------------------------------
# Slide 11 — Future Improvements
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Future Improvements")

improvements = [
    "Add user login and profile management",
    "Add trip planning itinerary",
    "Add offline map support",
    "Add safety alerts and track condition updates",
    "Add user-uploaded photos",
    "Add mobile app version",
    "Improve recommendation system based on user preferences",
]

add_bullets(
    slide,
    improvements,
    left=Inches(0.9), top=Inches(1.7),
    width=Inches(11.5), height=Inches(5.0),
    font_size=20,
)

add_speaker_note(
    slide,
    "In the future, Kiwi Trail could become a more complete outdoor planning "
    "platform with personal trip planning and safety-related features."
)


# ---------------------------------------------------------------------------
# Slide 12 — Conclusion
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Conclusion")

intro = slide.shapes.add_textbox(Inches(0.9), Inches(1.45), Inches(11.5), Inches(0.5))
tf = intro.text_frame
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Kiwi Trail helps users plan outdoor activities in New Zealand by combining:"
run.font.size = Pt(18)
run.font.color.rgb = TEXT_DARK

add_bullets(
    slide,
    [
        "Local outdoor datasets",
        "Interactive maps",
        "Search and filtering",
        "Weather information",
        "Navigation support",
        "User comments and favourites",
    ],
    left=Inches(0.9), top=Inches(2.1),
    width=Inches(11.5), height=Inches(3.3),
    font_size=18,
)

# Impact callout
impact = slide.shapes.add_shape(
    MSO_SHAPE.ROUNDED_RECTANGLE,
    Inches(0.9), Inches(5.5), Inches(11.5), Inches(1.3),
)
impact.fill.solid()
impact.fill.fore_color.rgb = NZ_GREEN
impact.line.fill.background()
tf = impact.text_frame
tf.margin_left = Inches(0.3)
tf.margin_top = Inches(0.15)
tf.word_wrap = True
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Impact"
run.font.bold = True
run.font.size = Pt(18)
run.font.color.rgb = TEXT_LIGHT
p = tf.add_paragraph()
p.space_before = Pt(4)
run = p.add_run()
run.text = (
    "Kiwi Trail makes hiking and camping information easier to access, helping "
    "both locals and visitors explore New Zealand safely and conveniently."
)
run.font.size = Pt(16)
run.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "To conclude, Kiwi Trail is a practical web application that uses local "
    "New Zealand data to improve the outdoor activity planning experience."
)


# ---------------------------------------------------------------------------
# Slide 13 — Recommended Timing (10 minutes)
# ---------------------------------------------------------------------------
slide = base_slide()
add_title(slide, "Recommended Timing — 10 Minutes")

# Build a simple two-column table-like layout
timing = [
    ("Title", "30 sec"),
    ("Problem Statement", "1 min"),
    ("Objective", "1 min"),
    ("Proposed Solution", "1 min"),
    ("Architecture", "1 min"),
    ("Workflow", "1 min"),
    ("Key Features", "1.5 min"),
    ("Implementation", "1 min"),
    ("Results / Demo", "1 min"),
    ("Challenges / Future / Conclusion", "1 min"),
]

table_left = Inches(2.5)
table_top = Inches(1.7)
col1_w = Inches(6.0)
col2_w = Inches(2.3)
row_h = Inches(0.45)

# Header
header_slide_col1 = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, table_left, table_top, col1_w, row_h
)
header_slide_col1.fill.solid()
header_slide_col1.fill.fore_color.rgb = NZ_GREEN
header_slide_col1.line.fill.background()
tf = header_slide_col1.text_frame
tf.margin_left = Inches(0.2)
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
run = p.add_run()
run.text = "Slide"
run.font.bold = True
run.font.size = Pt(16)
run.font.color.rgb = TEXT_LIGHT

header_time_col2 = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, table_left + col1_w, table_top, col2_w, row_h
)
header_time_col2.fill.solid()
header_time_col2.fill.fore_color.rgb = NZ_GREEN
header_time_col2.line.fill.background()
tf = header_time_col2.text_frame
tf.margin_left = Inches(0.2)
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Time"
run.font.bold = True
run.font.size = Pt(16)
run.font.color.rgb = TEXT_LIGHT

for i, (slide_name, time) in enumerate(timing):
    y = table_top + row_h * (i + 1)
    fill_color = BG_CARD if i % 2 == 0 else RGBColor(0xEC, 0xF4, 0xE6)

    c1 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, table_left, y, col1_w, row_h)
    c1.fill.solid()
    c1.fill.fore_color.rgb = fill_color
    c1.line.color.rgb = RGBColor(0xDD, 0xDD, 0xDD)
    c1.line.width = Pt(0.5)
    tf = c1.text_frame
    tf.margin_left = Inches(0.2)
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = slide_name
    run.font.size = Pt(14)
    run.font.color.rgb = TEXT_DARK

    c2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, table_left + col1_w, y, col2_w, row_h)
    c2.fill.solid()
    c2.fill.fore_color.rgb = fill_color
    c2.line.color.rgb = RGBColor(0xDD, 0xDD, 0xDD)
    c2.line.width = Pt(0.5)
    tf = c2.text_frame
    tf.margin_left = Inches(0.2)
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = time
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = NZ_GREEN

# Total row
total_y = table_top + row_h * (len(timing) + 1)
total = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, table_left, total_y, col1_w + col2_w, row_h
)
total.fill.solid()
total.fill.fore_color.rgb = NZ_GREEN_LIGHT
total.line.fill.background()
tf = total.text_frame
tf.margin_left = Inches(0.2)
p = tf.paragraphs[0]
run = p.add_run()
run.text = "Total: approximately 10 minutes"
run.font.bold = True
run.font.size = Pt(15)
run.font.color.rgb = TEXT_LIGHT

add_speaker_note(
    slide,
    "Suggested timing for a 10 minute presentation. Adjust as needed depending "
    "on questions or demo length."
)


# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
output_path = "Kiwi_Trail_Presentation.pptx"
prs.save(output_path)
print(f"Saved presentation to {output_path}")
