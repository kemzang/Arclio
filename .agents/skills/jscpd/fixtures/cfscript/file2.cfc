component accessName="UserService" {
    property name="dataSource" type="string" default="userdb";
    property name="cacheTTL" type="numeric" default="300";

    public query function getUsersByRole(required string role) {
        var sql = "SELECT id, username, email, created_at
                   FROM users
                   WHERE role = :role
                   AND active = 1
                   ORDER BY username ASC";

        var params = {
            role: { value: arguments.role, cfsqltype: "varchar" }
        };
        return queryExecute(sql, params, { datasource: dataSource });
    }

    public boolean function updateUserEmail(required numeric userId, required string email) {
        var sql = "UPDATE users SET email = :email, updated_at = NOW() WHERE id = :id";
        var params = {
            email: { value: arguments.email, cfsqltype: "varchar" },
            id: { value: arguments.userId, cfsqltype: "integer" }
        };
        queryExecute(sql, params, { datasource: dataSource });
        return true;
    }

    public query function searchUsers(required string searchTerm) {
        var sql = "SELECT id, username, email FROM users
                   WHERE username LIKE :term OR email LIKE :term
                   AND active = 1 ORDER BY username";
        var params = { term: { value: "%#arguments.searchTerm#%", cfsqltype: "varchar" } };
        return queryExecute(sql, params, { datasource: dataSource });
    }
}
