public class ContactService {

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

    public static Contact createContact(String firstName, String lastName, Id accountId) {
        Contact con = new Contact();
        con.FirstName = firstName;
        con.LastName = lastName;
        con.AccountId = accountId;
        con.OwnerId = UserInfo.getUserId();
        insert con;
        return con;
    }

    public static Boolean deleteContact(Id contactId) {
        try {
            Contact con = [SELECT Id FROM Contact WHERE Id = :contactId LIMIT 1];
            delete con;
            return true;
        } catch (DmlException e) {
            System.debug('Delete failed: ' + e.getMessage());
            return false;
        }
    }
}
