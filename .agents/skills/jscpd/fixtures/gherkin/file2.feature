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
    When I enter username "bob@example.com"
    And I enter password "AnotherPass456!"
    And I click the Login button
    Then I should be redirected to the dashboard
    And I should see "Welcome, Bob"
    And the session cookie should be set
    And the login event should be logged

  Scenario: Login with expired password
    When I enter username "bob@example.com"
    And I enter password "OldPassword123"
    And I click the Login button
    Then I should be redirected to the password reset page
    And I should see "Your password has expired"
    And the password expiry event should be logged

  Scenario: Remember me functionality
    When I enter valid credentials for "bob@example.com"
    And I check the Remember me checkbox
    And I click the Login button
    Then a persistent cookie should be set
    And the session should last for 30 days
    And the persistent login event should be logged
