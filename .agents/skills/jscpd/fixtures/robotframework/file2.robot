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

User Can Log Out After Login
    [Documentation]    Verify user can log out successfully
    [Tags]    authentication
    Enter Username    ${VALID_USER}
    Enter Password    ${VALID_PASS}
    Click Login Button
    Wait Until Page Contains    Dashboard
    Click Button    id:logout-btn
    Wait Until Page Contains    Sign in
    Current URL Should Contain    /login

Session Expires After Inactivity
    [Documentation]    Verify session times out correctly
    [Tags]    authentication    security
    Enter Username    ${VALID_USER}
    Enter Password    ${VALID_PASS}
    Click Login Button
    Wait Until Page Contains    Dashboard
    Sleep    31m
    Reload Page
    Current URL Should Contain    /login

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
