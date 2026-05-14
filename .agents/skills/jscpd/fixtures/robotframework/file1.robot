*** Settings ***
Library           SeleniumLibrary
Library           Collections
Library           String
Resource          ../resources/common.robot

Suite Setup       Open Browser    ${BASE_URL}    ${BROWSER}
Suite Teardown    Close All Browsers
Test Setup        Go To Login Page
Test Teardown     Clear Session

*** Variables ***
${BASE_URL}       http://localhost:3000
${BROWSER}        chrome
${VALID_USER}     testuser@example.com
${VALID_PASS}     SecurePass123!

*** Test Cases ***
Successful Login With Valid Credentials
    [Documentation]    Verify user can log in with valid credentials
    [Tags]    smoke    authentication
    Enter Username    ${VALID_USER}
    Enter Password    ${VALID_PASS}
    Click Login Button
    Wait Until Page Contains    Welcome back
    Page Should Contain    Dashboard
    Current URL Should Contain    /dashboard

Login Fails With Invalid Password
    [Documentation]    Verify login is rejected with wrong password
    [Tags]    authentication    negative
    Enter Username    ${VALID_USER}
    Enter Password    WrongPassword999
    Click Login Button
    Wait Until Page Contains    Invalid credentials
    Current URL Should Not Contain    /dashboard

Login Fails With Empty Fields
    [Documentation]    Verify login form validates required fields
    [Tags]    authentication    validation
    Click Login Button
    Wait Until Page Contains    required
    Page Should Contain    Email is required

*** Keywords ***
Go To Login Page
    Go To    ${BASE_URL}/login
    Wait Until Page Contains Element    id:login-form

Enter Username
    [Arguments]    ${username}
    Input Text    id:email    ${username}

Enter Password
    [Arguments]    ${password}
    Input Text    id:password    ${password}

Click Login Button
    Click Button    id:submit-btn

Clear Session
    Delete All Cookies
