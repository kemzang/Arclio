public class AccountService {

    public static Account createAccount(String name, String industry, String phone) {
        Account acc = new Account();
        acc.Name = name;
        acc.Industry = industry;
        acc.Phone = phone;
        acc.OwnerId = UserInfo.getUserId();
        acc.BillingCountry = 'US';
        acc.Type = 'Prospect';
        insert acc;
        return acc;
    }

    public static List<Account> getAccountsByIndustry(String industry) {
        return [
            SELECT Id, Name, Industry, Phone, OwnerId, BillingCountry, Type
            FROM Account
            WHERE Industry = :industry
            ORDER BY Name ASC
        ];
    }

    public static void updateAccountPhone(Id accountId, String newPhone) {
        Account acc = [SELECT Id, Phone FROM Account WHERE Id = :accountId LIMIT 1];
        acc.Phone = newPhone;
        update acc;
    }

    public static Boolean deleteAccount(Id accountId) {
        try {
            Account acc = [SELECT Id FROM Account WHERE Id = :accountId LIMIT 1];
            delete acc;
            return true;
        } catch (DmlException e) {
            System.debug('Delete failed: ' + e.getMessage());
            return false;
        }
    }
}
