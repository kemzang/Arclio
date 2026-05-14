\version "2.24.0"

\header {
  title = "Simple Piano Piece"
  composer = "Anonymous"
  instrument = "Piano"
  copyright = "Public Domain"
}

upper = \relative c'' {
  \clef treble
  \key c \major
  \time 4/4
  \tempo "Andante" 4 = 72

  c4 e g e |
  f a c a |
  g b d b |
  c2 r2 |

  e4 g c g |
  d f a f |
  e g b g |
  c1 |
}

lower = \relative c {
  \clef bass
  \key c \major
  \time 4/4

  c2 g2 |
  f2 c'2 |
  g2 d'2 |
  c1 |

  c2 e2 |
  d2 f2 |
  e2 g2 |
  c,1 |
}

\score {
  \new PianoStaff <<
    \new Staff \upper
    \new Staff \lower
  >>
  \layout { }
  \midi { }
}
