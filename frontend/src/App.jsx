import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import CreatePassword from './pages/auth/CreatePassword';
import PasswordResetSuccess from './pages/auth/PasswordResetSuccess';
import ProfileIntro from './pages/auth/ProfileIntro';
import ProfilePhoto from './pages/auth/ProfilePhoto';
import SetupProfile from './pages/auth/SetupProfile';
import ProfileComplete from './pages/auth/ProfileComplete';
import EditContact from './pages/EditContact';

import Home from './pages/Home';
import Scan from './pages/Scan';
import ScannedCardForm from './pages/ScannedCardForm';
import VoiceNote from './pages/VoiceNote';
import SetReminder from './pages/SetReminder';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import SortTasks from './pages/SortTasks';
import TeamDashboard from './pages/TeamDashboard';
import UnassignedContacts from './pages/UnassignedContacts';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import FilterContacts from './pages/FilterContacts';
import ExportContacts from './pages/ExportContacts';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RescheduleTask from './pages/RescheduleTask';
import EditTask from './pages/EditTask';
import MyAssignedContacts from './pages/MyAssignedContacts';
import RecentContacts from './pages/RecentContacts';
import HelpSupport from './pages/HelpSupport';
import FAQ from './pages/FAQ';
import ContactSupport from './pages/ContactSupport';
import ReportIssue from './pages/ReportIssue';
import AboutApp from './pages/AboutApp';
import Analytics from './pages/Analytics';
import ManualContactForm from './pages/ManualContactForm';


function Gate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (!user) return <Navigate to='/login' replace />;

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  return <Navigate to={user ? '/home' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<RootRedirect />} />

          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/verify-otp' element={<VerifyOTP />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/create-password' element={<CreatePassword />} />
          <Route
            path='/password-reset-success'
            element={<PasswordResetSuccess />}
          />

          <Route
            path='/profile-intro'
            element={
              <Gate>
                <ProfileIntro />
              </Gate>
            }
          />
          <Route
            path='/profile-photo'
            element={
              <Gate>
                <ProfilePhoto />
              </Gate>
            }
          />
          <Route
            path='/setup-profile'
            element={
              <Gate>
                <SetupProfile />
              </Gate>
            }
          />
          <Route
            path='/profile-complete'
            element={
              <Gate>
                <ProfileComplete />
              </Gate>
            }
          />

          <Route
            path='/home'
            element={
              <Gate>
                <Home />
              </Gate>
            }
          />
          <Route
            path='/scan'
            element={
              <Gate>
                <Scan />
              </Gate>
            }
          />
          <Route
            path='/scanned-card'
            element={
              <Gate>
                <ScannedCardForm />
              </Gate>
            }
          />
          <Route
            path='/voice-note'
            element={
              <Gate>
                <VoiceNote />
              </Gate>
            }
          />
          <Route
            path='/set-reminder'
            element={
              <Gate>
                <SetReminder />
              </Gate>
            }
          />
          <Route
            path='/contacts'
            element={
              <Gate>
                <Contacts />
              </Gate>
            }
          />
          <Route
            path='/contacts/:id'
            element={
              <Gate>
                <ContactDetail />
              </Gate>
            }
          />
          <Route
            path='/tasks'
            element={
              <Gate>
                <Tasks />
              </Gate>
            }
          />
          <Route
            path='/tasks/sort'
            element={
              <Gate>
                <SortTasks />
              </Gate>
            }
          />
          <Route
            path='/tasks/create'
            element={
              <Gate>
                <CreateTask />
              </Gate>
            }
          />
          <Route
            path='/team-dashboard'
            element={
              <Gate>
                <TeamDashboard />
              </Gate>
            }
          />
          <Route
            path='/admin/unassigned-contacts'
            element={
              <Gate>
                <UnassignedContacts />
              </Gate>
            }
          />
          <Route
            path='/tasks/:id'
            element={
              <Gate>
                <TaskDetail />
              </Gate>
            }
          />
          <Route
            path='/profile'
            element={
              <Gate>
                <Profile />
              </Gate>
            }
          />
          <Route
            path='/contacts/:id/edit'
            element={
              <Gate>
                <EditContact />
              </Gate>
            }
          />
          <Route
            path='/notifications'
            element={
              <Gate>
                <Notifications />
              </Gate>
            }
          />
          <Route
            path='/contacts/export'
            element={
              <Gate>
                <ExportContacts />
              </Gate>
            }
          />
          <Route
            path='/contacts/filters'
            element={
              <Gate>
                <FilterContacts />
              </Gate>
            }
          />
          <Route
            path='/privacy-policy'
            element={
              <Gate>
                <PrivacyPolicy />
              </Gate>
            }
          />
          <Route
            path='/tasks/:id/reschedule'
            element={
              <Gate>
                <RescheduleTask />
              </Gate>
            }
          />
          <Route
            path='/tasks/:id/edit'
            element={
              <Gate>
                <EditTask />
              </Gate>
            }
          />
          <Route
            path='/contacts/my-assigned'
            element={
              <Gate>
                <MyAssignedContacts />
              </Gate>
            }
          />
          <Route
            path='/contacts/recent'
            element={
              <Gate>
                <RecentContacts />
              </Gate>
            }
          />
          <Route
            path='/help-support'
            element={
              <Gate>
                <HelpSupport />
              </Gate>
            }
          />
          <Route
            path='/help-support/faq'
            element={
              <Gate>
                <FAQ />
              </Gate>
            }
          />
          <Route
            path='/help-support/contact'
            element={
              <Gate>
                <ContactSupport />
              </Gate>
            }
          />
          <Route
            path='/help-support/report'
            element={
              <Gate>
                <ReportIssue />
              </Gate>
            }
          />
          <Route
            path='/about-app'
            element={
              <Gate>
                <AboutApp />
              </Gate>
            }
          />
          <Route
            path='/analytics'
            element={
              <Gate>
                <Analytics />
              </Gate>
            }
          />
          <Route path="/contacts/new" element={<ManualContactForm />} />

          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
