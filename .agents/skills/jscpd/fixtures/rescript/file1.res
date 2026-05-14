// ReScript - Functional data processing
type student = {
  id: int,
  name: string,
  grades: array<float>,
  major: string,
}

// Calculate average of float array
let average = (grades: array<float>): float => {
  let n = Array.length(grades)
  if n == 0 {
    0.0
  } else {
    let sum = Array.reduce(grades, 0.0, (acc, g) => acc +. g)
    sum /. Float.fromInt(n)
  }
}

// Get letter grade from numeric score
let letterGrade = (score: float): string => {
  if score >= 90.0 {
    "A"
  } else if score >= 80.0 {
    "B"
  } else if score >= 70.0 {
    "C"
  } else if score >= 60.0 {
    "D"
  } else {
    "F"
  }
}

// Filter students by major
let filterByMajor = (major: string, students: array<student>): array<student> => {
  Array.keep(students, s => String.toLowerCase(s.major) == String.toLowerCase(major))
}

// Sort students by grade descending
let rankStudents = (students: array<student>): array<student> => {
  let copy = Array.copy(students)
  Array.sortInPlace(copy, (a, b) => {
    let avgA = average(a.grades)
    let avgB = average(b.grades)
    if avgA > avgB { -1 } else if avgA < avgB { 1 } else { 0 }
  })
  copy
}

let students: array<student> = [
  { id: 1, name: "Alice", grades: [95.0, 88.0, 92.0], major: "CS" },
  { id: 2, name: "Bob",   grades: [72.0, 68.0, 75.0], major: "Math" },
  { id: 3, name: "Carol", grades: [91.0, 95.0, 89.0], major: "CS" },
]

let csStudents = filterByMajor("CS", students)
let ranked = rankStudents(csStudents)
Array.forEach(ranked, s =>
  Js.log(s.name ++ ": " ++ letterGrade(average(s.grades)))
)
