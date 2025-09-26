#set page(
  paper: "a4",
  numbering: (current, total) => text(size: 9pt, fill: luma(140))[#current van #total],
  header: text(size: 9pt, fill: luma(140))[Model H 1 Kandidatenlijst],
)

#set text(
  font: "DM Sans",
  size: 10pt
)

#set heading(
  numbering: (..n) => numbering("1.1.", ..n) + h(0.5em),
  hanging-indent: 20pt,
)

#let input = json("/inputs/h1.json")

#show heading: set block(
  stroke: (
    top: 1pt + black
  ),
  inset: (
    top: 1em,
  ),
  width: 100%,
  above: 2em,
  below: 1.5em
)

= Aanduiding van de politieke groepering

Aanduiding boven de kandidatenlijst:

*#input.name*

= Kandidaten op de lijst

#table(
  columns: (2em, 1fr, 7em, 10em, 13em),
  inset: 10pt,
  stroke: (x, y) => (
    y: if y > 1 { 0.5pt + luma(220) },
  ),
  table.header[][_naam_][_voorletters_][_geboortedatum_][_woonplaats_],
  ..input.candidate.map(c => {
    ([#c.number], c.name, c.initials, c.birthdate, c.locality)
  }).flatten()
)

= QR code

QR-code met de alle gegevens van deze kandidatenlijst:
#image("/inputs/qr.svg", width: 90mm)
