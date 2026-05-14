Object subclass: #DataProcessor
    instanceVariableNames: 'items capacity maxLength'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'Example-Utils'

DataProcessor class >> new [
    ^super new initialize
]

DataProcessor >> initialize [
    capacity  := 100.
    maxLength := 255.
    items     := OrderedCollection new.
]

DataProcessor >> validateInput: aString [
    aString isEmpty ifTrue: [
        Error signal: 'Input cannot be empty'
    ].
    aString size > maxLength ifTrue: [
        Error signal: 'Input exceeds maximum length'
    ].
    ^aString
]

DataProcessor >> addItem: anItem [
    | validated |
    validated := self validateInput: anItem.
    items add: validated.
    ^self
]

DataProcessor >> removeItem: anItem [
    items remove: anItem ifAbsent: [nil].
    ^self
]

DataProcessor >> count [
    ^items size
]

DataProcessor >> isEmpty [
    ^items isEmpty
]

"File-specific: find maximum value"
DataProcessor >> maxValue [
    ^items inject: items first into: [:acc :each |
        each > acc ifTrue: [each] ifFalse: [acc]
    ]
]
