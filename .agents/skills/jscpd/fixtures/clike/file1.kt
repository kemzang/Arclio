package com.example.utils

class DataProcessor(private val maxLength: Int = 255) {

    private val items = mutableListOf<String>()

    fun validateInput(value: String): String {
        require(value.isNotBlank()) { "Input cannot be empty" }
        require(value.length <= maxLength) { "Input exceeds maximum length" }
        return value.trim()
    }

    fun addItem(item: String): DataProcessor {
        items.add(validateInput(item))
        return this
    }

    fun removeItem(item: String): DataProcessor {
        items.remove(item)
        return this
    }

    fun count(): Int = items.size

    fun isEmpty(): Boolean = items.isEmpty()

    fun filterItems(predicate: (String) -> Boolean): List<String> {
        return items.filter(predicate)
    }

    fun <R> mapItems(transform: (String) -> R): List<R> {
        return items.map(transform)
    }

    // File-specific: sum numeric values
    fun sumValues(): Long {
        return items.sumOf { it.toLongOrNull() ?: 0L }
    }
}

fun retryOnFailure(maxAttempts: Int, action: () -> Unit) {
    var attempt = 0
    while (attempt < maxAttempts) {
        try {
            action()
            return
        } catch (e: Exception) {
            attempt++
            if (attempt >= maxAttempts) throw e
            Thread.sleep(1000)
        }
    }
}
