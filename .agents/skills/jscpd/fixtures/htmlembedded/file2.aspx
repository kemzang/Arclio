<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Register.aspx.cs" Inherits="MyApp.Register" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Register - My Application</title>
    <link rel="stylesheet" href="~/Content/bootstrap.min.css" />
    <link rel="stylesheet" href="~/Content/site.css" />
</head>
<body>
    <form id="form1" runat="server">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <asp:Panel ID="pnlRegister" runat="server" CssClass="card mt-5">
                        <div class="card-header">
                            <h4 class="mb-0">Create Account</h4>
                        </div>
                        <div class="card-body">
                            <asp:Label ID="lblError" runat="server" CssClass="alert alert-danger" Visible="false" />
                            <div class="form-group">
                                <asp:Label ID="lblUsername" runat="server" AssociatedControlID="txtUsername" Text="Username:" />
                                <asp:TextBox ID="txtUsername" runat="server" CssClass="form-control" MaxLength="100" />
                                <asp:RequiredFieldValidator ID="rfvUsername" runat="server"
                                    ControlToValidate="txtUsername" ErrorMessage="Username is required"
                                    CssClass="text-danger" Display="Dynamic" />
                            </div>
                            <div class="form-group">
                                <asp:Label ID="lblPassword" runat="server" AssociatedControlID="txtPassword" Text="Password:" />
                                <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" CssClass="form-control" />
                                <asp:RequiredFieldValidator ID="rfvPassword" runat="server"
                                    ControlToValidate="txtPassword" ErrorMessage="Password is required"
                                    CssClass="text-danger" Display="Dynamic" />
                            </div>
                            <div class="form-group">
                                <asp:Label ID="lblEmail" runat="server" AssociatedControlID="txtEmail" Text="Email:" />
                                <asp:TextBox ID="txtEmail" runat="server" CssClass="form-control" MaxLength="255" />
                                <asp:RequiredFieldValidator ID="rfvEmail" runat="server"
                                    ControlToValidate="txtEmail" ErrorMessage="Email is required"
                                    CssClass="text-danger" Display="Dynamic" />
                            </div>
                            <asp:Button ID="btnRegister" runat="server" Text="Register"
                                CssClass="btn btn-primary btn-block" OnClick="btnRegister_Click" />
                        </div>
                    </asp:Panel>
                </div>
            </div>
        </div>
    </form>
    <script src="~/Scripts/jquery.min.js"></script>
    <script src="~/Scripts/bootstrap.min.js"></script>
</body>
</html>
