package com.example.utils

import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

@Slf4j
@CompileStatic
class DataUtils {

    static String validateInput(String value) {
        if (!value?.trim()) {
            throw new IllegalArgumentException('Input cannot be empty')
        }
        if (value.length() > 255) {
            throw new IllegalArgumentException('Input exceeds maximum length')
        }
        return value.trim()
    }

    static Integer parseIntSafe(String s) {
        try {
            return Integer.parseInt(s)
        } catch (NumberFormatException e) {
            return null
        }
    }

    static <T> List<T> retryOnFailure(int maxAttempts, Closure<T> action) {
        int attempt = 0
        while (attempt < maxAttempts) {
            try {
                return [action.call()]
            } catch (Exception e) {
                attempt++
                if (attempt >= maxAttempts) throw e
                log.warn("Retry {} of {}", attempt, maxAttempts)
                Thread.sleep(1000)
            }
        }
        return []
    }

    // File-specific: fetch products
    static List<Map> fetchProducts(String endpoint) {
        log.info("Fetching products from $endpoint")
        return []
    }
}
