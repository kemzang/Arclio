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

// Get passing students (average >= 60)
let passingStudents = (students: array<student>): array<student> => {
  Array.keep(students, s => average(s.grades) >= 60.0)
}

let students: array<student> = [
  { id: 1, name: "Alice", grades: [95.0, 88.0, 92.0], major: "CS" },
  { id: 2, name: "Bob",   grades: [55.0, 48.0, 52.0], major: "Math" },
  { id: 3, name: "Carol", grades: [91.0, 95.0, 89.0], major: "CS" },
]

let passing = passingStudents(students)
Array.forEach(passing, s =>
  Js.log(s.name ++ ": " ++ letterGrade(average(s.grades)))
)
