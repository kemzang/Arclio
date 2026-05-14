Feature: User Authentication
  As a registered user
  I want to log in to my account
  So that I can access protected resources

  Background:
    Given the application server is running
    And the database has test users loaded
    And the session store is initialized
    And the rate limiter counters are reset
    And the email service is configured correctly
    And the audit log system is operational
    And I am on the login page

  Scenario: Successful login with valid credentials
    When I enter username "alice@example.com"
    And I enter password "SecurePass123!"
    And I click the Login button
    Then I should be redirected to the dashboard
    And I should see "Welcome, Alice"
    And the session cookie should be set
    And the login event should be logged

  Scenario: Failed login with invalid password
    When I enter username "alice@example.com"
    And I enter password "WrongPassword"
    And I click the Login button
    Then I should see the error "Invalid credentials"
    And I should remain on the login page
    And the session cookie should not be set
    And the failed login event should be logged

  Scenario: Account locked after too many failed attempts
    When I attempt to login with wrong password 5 times
    Then I should see the error "Account locked"
    And I should receive a lockout email at "alice@example.com"
    And the account locked event should be logged
