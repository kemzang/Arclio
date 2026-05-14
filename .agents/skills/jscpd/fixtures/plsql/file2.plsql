-- PL/SQL Package for employee management
CREATE OR REPLACE PACKAGE emp_mgmt AS
  PROCEDURE hire_employee(
    p_first_name  IN VARCHAR2,
    p_last_name   IN VARCHAR2,
    p_email       IN VARCHAR2,
    p_department  IN VARCHAR2,
    p_salary      IN NUMBER,
    p_emp_id      OUT NUMBER
  );

  PROCEDURE update_salary(
    p_emp_id     IN NUMBER,
    p_new_salary IN NUMBER
  );

  FUNCTION get_employee_count(
    p_department IN VARCHAR2
  ) RETURN NUMBER;
END emp_mgmt;
/

CREATE OR REPLACE PACKAGE BODY emp_mgmt AS

  PROCEDURE hire_employee(
    p_first_name  IN VARCHAR2,
    p_last_name   IN VARCHAR2,
    p_email       IN VARCHAR2,
    p_department  IN VARCHAR2,
    p_salary      IN NUMBER,
    p_emp_id      OUT NUMBER
  ) IS
    v_dept_id NUMBER;
  BEGIN
    SELECT department_id INTO v_dept_id
    FROM departments
    WHERE department_name = p_department;

    INSERT INTO employees (
      first_name, last_name, email,
      department_id, salary, hire_date
    ) VALUES (
      p_first_name, p_last_name, p_email,
      v_dept_id, p_salary, SYSDATE
    ) RETURNING employee_id INTO p_emp_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Hired employee: ' || p_emp_id);
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Department not found: ' || p_department);
    WHEN DUP_VAL_ON_INDEX THEN
      RAISE_APPLICATION_ERROR(-20002, 'Email already exists: ' || p_email);
  END hire_employee;

  PROCEDURE terminate_employee(
    p_emp_id         IN NUMBER,
    p_termination_dt IN DATE DEFAULT SYSDATE
  ) IS
  BEGIN
    UPDATE employees
    SET status = 'TERMINATED',
        termination_date = p_termination_dt,
        last_modified = SYSDATE
    WHERE employee_id = p_emp_id;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20003, 'Employee not found: ' || p_emp_id);
    END IF;
    COMMIT;
  END terminate_employee;

  FUNCTION get_employee_count(
    p_department IN VARCHAR2
  ) RETURN NUMBER IS
    v_count NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v_count
    FROM employees e
    JOIN departments d ON e.department_id = d.department_id
    WHERE d.department_name = p_department;
    RETURN v_count;
  END get_employee_count;

END emp_mgmt;
/
