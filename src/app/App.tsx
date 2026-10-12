import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../lib/auth";
import { ToastProvider } from "../lib/toast";
import { ProfileProvider } from "../profile/store";
import { AssistantProvider } from "../assistant/store";
import { RecordsProvider } from "../records/store";
import { AutoSteps } from "./AutoSteps";
import { CustomerDetail } from "../screens/money/CustomerDetail";
import { CustomerForm } from "../screens/money/CustomerForm";
import { Customers } from "../screens/money/Customers";
import { MessageDraft } from "../screens/money/MessageDraft";
import { MoneyHome } from "../screens/money/MoneyHome";
import { ProductForm } from "../screens/money/ProductForm";
import { Products } from "../screens/money/Products";
import { RecordDetail } from "../screens/money/RecordDetail";
import { RecordExpense } from "../screens/money/RecordExpense";
import { RecordSale } from "../screens/money/RecordSale";
import { Assistant, AssistantSettings } from "../screens/Assistant";
import { Business } from "../screens/Business";
import { Auth, ForgotPassword, ResetPassword } from "../screens/Auth";
import { Journey } from "../screens/Journey";
import { Library } from "../screens/Library";
import { ModuleDetail } from "../screens/ModuleDetail";
import { Building, Onboarding, Summary } from "../screens/Onboarding";
import { Profile } from "../screens/Profile";
import { Gate, NotFound, Shell } from "../screens/Shell";
import { Splash } from "../screens/Splash";
import { Today } from "../screens/Today";
import { Welcome } from "../screens/Welcome";
import { Write } from "../screens/Write";
import { WriteDraft } from "../screens/WriteDraft";

export function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <RecordsProvider>
        <AutoSteps />
        <BrowserRouter>
          <div className="app">
            <ToastProvider>
            <AssistantProvider>
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/signup" element={<Auth key="signup" mode="signup" />} />
              <Route path="/login" element={<Auth key="login" mode="login" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/onboarding"
                element={
                  <Gate onboarded={false}>
                    <Onboarding />
                  </Gate>
                }
              />
              <Route
                path="/onboarding/building"
                element={
                  <Gate onboarded={false}>
                    <Building />
                  </Gate>
                }
              />
              <Route
                path="/onboarding/summary"
                element={
                  <Gate onboarded={false}>
                    <Summary />
                  </Gate>
                }
              />
              <Route
                path="/module/:id"
                element={
                  <Gate>
                    <ModuleDetail />
                  </Gate>
                }
              />
              <Route path="/money/sale" element={<Gate><RecordSale /></Gate>} />
              <Route path="/money/expense" element={<Gate><RecordExpense /></Gate>} />
              <Route path="/money/customers" element={<Gate><Customers /></Gate>} />
              <Route path="/money/customer/:key" element={<Gate><CustomerDetail /></Gate>} />
              <Route path="/money/customer/:key/edit" element={<Gate><CustomerForm /></Gate>} />
              <Route path="/money/message/reminder/:key" element={<Gate><MessageDraft kind="reminder" /></Gate>} />
              <Route path="/money/message/receipt/:id" element={<Gate><MessageDraft kind="receipt" /></Gate>} />
              <Route path="/money/products" element={<Gate><Products /></Gate>} />
              <Route path="/money/product/:id" element={<Gate><ProductForm /></Gate>} />
              <Route path="/money/record/:kind/:id" element={<Gate><RecordDetail /></Gate>} />
              <Route path="/business" element={<Gate><Business /></Gate>} />
              <Route path="/write" element={<Gate><Write /></Gate>} />
              <Route path="/write/:kind" element={<Gate><WriteDraft /></Gate>} />
              <Route path="/assistant" element={<Gate><Assistant /></Gate>} />
              <Route path="/assistant/settings" element={<Gate><AssistantSettings /></Gate>} />
              <Route path="/app" element={<Shell />}>
                <Route index element={<Navigate to="today" replace />} />
                <Route path="today" element={<Today />} />
                <Route path="money" element={<MoneyHome />} />
                <Route path="library" element={<Library />} />
                <Route path="journey" element={<Journey />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AssistantProvider>
            </ToastProvider>
          </div>
        </BrowserRouter>
        </RecordsProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
