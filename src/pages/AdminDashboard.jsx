import React, { useState, useEffect } from "react";
import { adminService } from "@/api/entities";
import { toast } from "sonner";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MoreVertical,
  ChevronRight,
  UserPlus,
  ShieldAlert,
  BarChart3,
  Calendar,
  Lock
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventMetrics, setEventMetrics] = useState(null);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    capacity: 50,
    cover_emoji: "🎉",
    is_public: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
      
      if (user?.role === 'super_admin') {
        const logsData = await adminService.getLogs();
        setLogs(logsData);
      }
      
      if (['super_admin', 'admin', 'moderator'].includes(user?.role)) {
        const [reportsData, verifData] = await Promise.all([
          adminService.getReports(),
          adminService.getVerifications()
        ]);
        setReports(reportsData);
        setVerifications(verifData);
      }

      if (['super_admin', 'admin'].includes(user?.role)) {
        const revData = await adminService.getRevenue();
        setRevenueData(revData);
        const eventsData = await adminService.getEvents();
        setEvents(eventsData);
        const settingsData = await adminService.getSettings();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !["super_admin", "admin", "moderator", "support"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchData();
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleWarnUser = async (userId) => {
    const reason = window.prompt("Reason for warning:");
    if (!reason) return;
    try {
      await adminService.warnUser(userId, reason);
      alert("Warning sent successfully");
    } catch (err) {
      console.error("Failed to warn user", err);
    }
  };

  const handleForceVerification = async (userId) => {
    if (!window.confirm("Are you sure you want to force this user to re-verify?")) return;
    try {
      await adminService.forceVerification(userId);
      alert("User forced to re-verify");
      fetchData();
    } catch (err) {
      console.error("Failed to force verification", err);
    }
  };

  const handleGrantPremium = async (userId) => {
    if (!window.confirm("Grant 30 days of Premium to this user?")) return;
    try {
      await adminService.grantPremium(userId);
      alert("Premium granted successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to grant premium", err);
    }
  };

  const handleExtendPremium = async (userId) => {
    const days = window.prompt("Enter number of days to extend:");
    if (!days) return;
    try {
      await adminService.extendPremium(userId, parseInt(days));
      alert(`Premium extended by ${days} days`);
      fetchData();
    } catch (err) {
      console.error("Failed to extend premium", err);
    }
  };

  const handleRefund = async (txId) => {
    const amount = window.prompt("Enter refund amount (optional, leave empty for full refund):");
    const reason = window.prompt("Enter refund reason:");
    if (reason === null) return;
    try {
      await adminService.refundTransaction(txId, amount ? parseFloat(amount) : null, reason);
      alert("Refund processed successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to process refund", err);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      fetchData();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleResolveReport = async (reportId, newStatus) => {
    try {
      await adminService.updateReportStatus(reportId, newStatus);
      fetchData();
    } catch (err) {
      console.error("Failed to resolve report", err);
    }
  };

  const handleResolveVerification = async (vId, status, reason = "") => {
    try {
      await adminService.updateVerificationStatus(vId, status, reason);
      fetchData();
    } catch (err) {
      console.error("Failed to resolve verification", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await adminService.deleteEvent(eventId);
      fetchData();
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await adminService.updateEvent(editingEvent._id, eventForm);
      } else {
        await adminService.createEvent(eventForm);
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setEventForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        capacity: 50,
        cover_emoji: "🎉",
        is_public: true
      });
      fetchData();
    } catch (err) {
      console.error("Failed to save event", err);
    }
  };

  const handleViewMetrics = async (eventId) => {
    try {
      const data = await adminService.getEventMetrics(eventId);
      setEventMetrics(data);
      setIsMetricsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch event metrics", err);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    if (user.role !== 'super_admin') {
      toast.error("Only Super Admin can change settings");
      return;
    }
    try {
      await adminService.updateSetting(key, value);
      fetchData();
      toast.success("Setting updated");
    } catch (err) {
      console.error("Failed to update setting", err);
      toast.error(err.response?.data?.error || "Failed to update setting");
    }
  };

  const handleExportReport = () => {
    let dataToExport = [];
    let filename = `aura_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (activeTab) {
      case 'overview':
        dataToExport = [
          ['Metric', 'Value'],
          ['Total Users', stats?.totalUsers || 0],
          ['Active Users', stats?.activeUsers || 0],
          ['Premium Users', stats?.premiumUsers || 0],
          ['Total Messages', stats?.totalMessages || 0],
          ['Total Matches', stats?.totalMatches || 0],
        ];
        break;
      case 'users':
        dataToExport = [
          ['Username', 'Email', 'Role', 'Status', 'Risk Score', 'Joined Date'],
          ...users.map(u => [u.username, u.email, u.role, u.status, u.risk_score, new Date(u.createdAt).toLocaleDateString()])
        ];
        break;
      case 'moderation':
        dataToExport = [
          ['Type', 'Reporter/User', 'Reported/Subject', 'Reason', 'Status', 'Date'],
          ...reports.map(r => ['Report', r.reporter_email, r.reported_email, r.reason, r.status, new Date(r.createdAt).toLocaleDateString()]),
          ...verifications.map(v => ['Photo Verification', v.user_email, 'N/A', v.verification_type, v.status, new Date(v.createdAt).toLocaleDateString()])
        ];
        break;
      case 'revenue':
        dataToExport = [
          ['Reference', 'User', 'Plan', 'Amount', 'Status', 'Date'],
          ...revenueData?.transactions?.map(tx => [tx.reference, tx.user_email, tx.plan, tx.amount, tx.status, new Date(tx.createdAt).toLocaleDateString()])
        ];
        break;
      case 'safety':
        dataToExport = [
          ['User Email', 'Risk Score', 'Status', 'Is Verified'],
          ...users.filter(u => u.risk_score > 30).map(u => [u.email, u.risk_score, u.status, u.profile?.is_verified ? 'Yes' : 'No'])
        ];
        break;
      case 'events':
        dataToExport = [
          ['Title', 'Date', 'Location', 'Capacity', 'Attendees'],
          ...events.map(e => [e.title, e.event_date, e.location, e.capacity, e.rsvp_emails?.length || 0])
        ];
        break;
      case 'logs':
        dataToExport = [
          ['Admin', 'Action', 'Target Type', 'Target ID', 'Timestamp'],
          ...logs.map(l => [l.adminEmail, l.action, l.targetType, l.targetId, new Date(l.createdAt).toLocaleString()])
        ];
        break;
      default:
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + dataToExport.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEventModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        capacity: event.capacity,
        cover_emoji: event.cover_emoji,
        is_public: event.is_public
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        capacity: 50,
        cover_emoji: "🎉",
        is_public: true
      });
    }
    setIsEventModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            AURA ADMIN
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<BarChart3 />} 
            label="Dashboard" 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
          />
          <NavItem 
            icon={<Users />} 
            label="Users" 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
          />
          <NavItem 
            icon={<ShieldAlert />} 
            label="Moderation" 
            active={activeTab === "moderation"} 
            onClick={() => setActiveTab("moderation")} 
          />
          {['super_admin', 'admin'].includes(user.role) && (
            <NavItem 
              icon={<TrendingUp />} 
              label="Revenue" 
              active={activeTab === "revenue"} 
              onClick={() => setActiveTab("revenue")} 
            />
          )}
          <NavItem 
            icon={<ShieldAlert />} 
            label="Safety Intelligence" 
            active={activeTab === "safety"} 
            onClick={() => setActiveTab("safety")} 
          />
          <NavItem 
            icon={<Calendar />} 
            label="Events" 
            active={activeTab === "events"} 
            onClick={() => setActiveTab("events")} 
          />
          {user.role === 'super_admin' && (
            <NavItem 
              icon={<Lock />} 
              label="System Logs" 
              active={activeTab === "logs"} 
              onClick={() => setActiveTab("logs")} 
            />
          )}
          <div className="pt-4 border-t border-gray-100">
            <NavItem 
              icon={<Settings />} 
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => setActiveTab("settings")} 
            />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-gray-500">Welcome back, {user.username}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchData}>Refresh Data</Button>
              <Button 
                onClick={handleExportReport}
                className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white border-0"
              >
                Export Report
              </Button>
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Users" 
                  value={stats?.totalUsers || 0} 
                  icon={<Users className="text-blue-500" />} 
                  trend="+12%"
                  loading={loading}
                />
                <StatCard 
                  title="Active Users" 
                  value={stats?.activeUsers || 0} 
                  icon={<Users className="text-green-500" />} 
                  trend="+8%"
                  loading={loading}
                />
                <StatCard 
                  title="Premium Users" 
                  value={stats?.premiumUsers || 0} 
                  icon={<Shield className="text-amber-500" />} 
                  trend="+5%"
                  loading={loading}
                />
                <StatCard 
                  title="Total Matches" 
                  value={stats?.totalMatches || 0} 
                  icon={<TrendingUp className="text-green-500" />} 
                  trend="+18%"
                  loading={loading}
                />
              </div>

              {/* Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AlertCard 
                  type="reported" 
                  count={reports.filter(r => r.status === 'pending').length} 
                  title="Reported Users" 
                  description="New reports pending review" 
                  onClick={() => setActiveTab("moderation")}
                />
                <AlertCard 
                  type="content" 
                  count={verifications.filter(v => v.status === 'pending').length} 
                  title="Flagged Content" 
                  description="Photos pending moderation" 
                  onClick={() => setActiveTab("moderation")}
                />
                <AlertCard 
                  type="payment" 
                  count={revenueData?.transactions?.filter(t => t.status === 'failed').length || 0} 
                  title="Payment Issues" 
                  description="Failed transactions" 
                  onClick={() => setActiveTab("revenue")}
                />
              </div>

              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData?.revenueTrend || []}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData?.revenueTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-xl font-bold">User Management</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-10 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              {u.username}
                            </div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              u.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-0' :
                              u.status === 'suspended' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0' :
                              'bg-rose-100 text-rose-700 hover:bg-rose-100 border-0'
                            }>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${u.risk_score > 50 ? 'bg-rose-500' : 'bg-green-500'}`} />
                              {u.risk_score}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(u);
                                  setIsUserModalOpen(true);
                                }}>
                                  View Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleWarnUser(u._id)}>
                                  Warn User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleForceVerification(u._id)}>
                                  Force Re-verification
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGrantPremium(u._id)}>
                                  Grant Premium
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExtendPremium(u._id)}>
                                  Extend Premium
                                </DropdownMenuItem>
                                {user?.role === 'super_admin' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')}>
                                      {u.status === 'suspended' ? 'Unsuspend Account' : 'Suspend Account'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(u._id, u.status === 'banned' ? 'active' : 'banned')} className="text-rose-600">
                                      {u.status === 'banned' ? 'Unban Account' : 'Ban Permanently'}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateRole(u._id, 'admin')}>Make Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateRole(u._id, 'moderator')}>Make Moderator</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateRole(u._id, 'user')}>Make User</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "moderation" && (
            <div className="space-y-8">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Photo Review Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Selfie</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifications.filter(v => v.status === 'pending').map((v) => (
                          <TableRow key={v._id}>
                            <TableCell className="text-xs">{v.user_email}</TableCell>
                            <TableCell>
                              {v.selfie_url ? (
                                <img src={v.selfie_url} className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-150 transition-transform" />
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px]">
                                {v.verification_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-amber-100 text-amber-700">{v.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleResolveVerification(v._id, 'approved')}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8" onClick={() => {
                                  const reason = window.prompt("Rejection reason:");
                                  if (reason) handleResolveVerification(v._id, 'rejected', reason);
                                }}>
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Report Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Reported User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report._id}>
                            <TableCell className="text-xs">{report.reporter_email}</TableCell>
                            <TableCell className="font-medium text-xs">{report.reported_email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px]">
                                {report.reason}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-xs truncate">
                              {report.details}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                report.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0' :
                                report.status === 'reviewed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0' :
                                'bg-green-100 text-green-700 hover:bg-green-100 border-0'
                              }>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                  <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleResolveReport(report._id, 'reviewed')}>
                                    Mark as Reviewed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleResolveReport(report._id, 'resolved')}>
                                    Mark as Resolved
                                  </DropdownMenuItem>
                                  {user?.role === 'super_admin' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          const userToSuspend = users.find(u => u.email === report.reported_email);
                                          if (userToSuspend) handleUpdateStatus(userToSuspend._id, 'suspended');
                                        }}
                                        className="text-amber-600"
                                      >
                                        Suspend Reported User
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          const userToBan = users.find(u => u.email === report.reported_email);
                                          if (userToBan) handleUpdateStatus(userToBan._id, 'banned');
                                        }}
                                        className="text-rose-600"
                                      >
                                        Ban Reported User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "safety" && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Safety Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-rose-700 mb-2">High Risk Users</h4>
                    <p className="text-3xl font-bold text-rose-900">{users.filter(u => u.risk_score > 50).length}</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                    <h4 className="font-bold text-green-700 mb-2">Verified Ratio</h4>
                    <p className="text-3xl font-bold text-green-900">
                      {Math.round((users.filter(u => u.profile?.is_verified).length / users.length) * 100 || 0)}%
                    </p>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.sort((a,b) => b.risk_score - a.risk_score).slice(0, 10).map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="text-sm font-medium">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                              <div 
                                className={`h-full ${u.risk_score > 70 ? 'bg-rose-500' : u.risk_score > 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${u.risk_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{u.risk_score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            u.risk_score > 70 ? 'bg-rose-100 text-rose-700' :
                            u.risk_score > 30 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }>
                            {u.risk_score > 70 ? 'Critical' : u.risk_score > 30 ? 'Warning' : 'Low'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-600 hover:bg-rose-50 rounded-xl"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsUserModalOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Revenue" 
                  value={`$${revenueData?.total || 0}`} 
                  icon={<TrendingUp className="text-green-500" />} 
                  trend="+15%"
                />
                <StatCard 
                  title="Premium Subscriptions" 
                  value={revenueData?.premiumCount || 0} 
                  icon={<Shield className="text-amber-500" />} 
                  trend="+8%"
                />
                <StatCard 
                  title="Casual Connections" 
                  value={revenueData?.casualCount || 0} 
                  icon={<Users className="text-blue-500" />} 
                  trend="+12%"
                />
              </div>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Monthly Revenue Detailed</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData?.revenueTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Transaction Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData?.transactions?.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell className="text-xs font-mono">{tx.reference}</TableCell>
                          <TableCell className="text-xs">{tx.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[10px]">{tx.plan}</Badge>
                          </TableCell>
                          <TableCell className="font-bold">${tx.amount}</TableCell>
                          <TableCell>
                            <Badge className={
                              tx.status === 'success' ? 'bg-green-100 text-green-700' :
                              tx.status === 'refunded' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.status === 'success' && (
                              <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => handleRefund(tx._id)}>
                                Refund
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "events" && (
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-xl font-bold">Events Management</CardTitle>
                <Button 
                  onClick={() => openEventModal()}
                  className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Attendees</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{event.cover_emoji}</span>
                              <div>
                                <div className="font-bold">{event.title}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{event.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{event.event_date}</div>
                            <div className="text-xs text-gray-500">{event.event_time}</div>
                          </TableCell>
                          <TableCell className="text-sm">{event.location}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-full">
                              {event.rsvp_emails?.length || 0} / {event.capacity || '∞'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={event.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {event.is_public ? 'Public' : 'Private'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem onClick={() => handleViewMetrics(event._id)}>
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Event Metrics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEventModal(event)}>Edit Event</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteEvent(event._id)} className="text-rose-600">
                                  Delete Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold">System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium">{log.adminEmail}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-500">
                              {log.targetType}: {log.targetId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono bg-gray-50 p-1 rounded">
                              {JSON.stringify(log.details)}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Authentication & Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingRow 
                    label="User Registration" 
                    description="Allow new users to create accounts" 
                    checked={settings.find(s => s.key === 'allow_registration')?.value !== false}
                    onCheckedChange={(v) => handleUpdateSetting('allow_registration', v)}
                    disabled={user.role !== 'super_admin'}
                  />
                  <SettingRow 
                    label="Maintenance Mode" 
                    description="Put the platform in maintenance mode (admins only)" 
                    checked={settings.find(s => s.key === 'maintenance_mode')?.value === true}
                    onCheckedChange={(v) => handleUpdateSetting('maintenance_mode', v)}
                    disabled={user.role !== 'super_admin'}
                  />
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">AI & Safety</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingRow 
                    label="AI Relationship Coach" 
                    description="Enable AI-powered dating advice and insights" 
                    checked={settings.find(s => s.key === 'enable_ai_coach')?.value !== false}
                    onCheckedChange={(v) => handleUpdateSetting('enable_ai_coach', v)}
                    disabled={user.role !== 'super_admin'}
                  />
                  <SettingRow 
                    label="Force Photo Verification" 
                    description="Require all users to verify their photos before matching" 
                    checked={settings.find(s => s.key === 'force_photo_verification')?.value === true}
                    onCheckedChange={(v) => handleUpdateSetting('force_photo_verification', v)}
                    disabled={user.role !== 'super_admin'}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Event Create/Edit Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the details for this platform event." : "Fill in the details to create a new community event."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                className="rounded-xl resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({...eventForm, event_time: e.target.value})}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input 
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({...eventForm, capacity: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Cover Emoji</Label>
                <Input 
                  value={eventForm.cover_emoji}
                  onChange={(e) => setEventForm({...eventForm, cover_emoji: e.target.value})}
                  placeholder="🎉"
                  className="rounded-xl text-center"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <Label className="cursor-pointer">Public Event</Label>
              <Switch 
                checked={eventForm.is_public}
                onCheckedChange={(checked) => setEventForm({...eventForm, is_public: checked})}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-xl border-0">
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Metrics Modal */}
      <Dialog open={isMetricsModalOpen} onOpenChange={setIsMetricsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              Event Performance
            </DialogTitle>
            <DialogDescription>
              Detailed metrics for this event, including attendance and engagement.
            </DialogDescription>
          </DialogHeader>
          {eventMetrics && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Attendees</div>
                  <div className="text-2xl font-bold text-gray-900">{eventMetrics.attendees}</div>
                  <div className="text-[10px] text-gray-400">Capacity: {eventMetrics.capacity || '∞'}</div>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="text-xs text-rose-600 mb-1">Matches Created</div>
                  <div className="text-2xl font-bold text-rose-700">{eventMetrics.matchesCreated}</div>
                  <div className="text-[10px] text-rose-400">Within 24h of event</div>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-xs text-purple-600">Engagement Level</div>
                  <div className="text-xl font-bold text-purple-700">{eventMetrics.engagement}</div>
                </div>
                <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-1000" 
                    style={{ width: `${Math.min((eventMetrics.engagement / (eventMetrics.attendees || 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-purple-400 mt-2">Based on upvotes and interactions</div>
              </div>
              <Button onClick={() => setIsMetricsModalOpen(false)} className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white border-0">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>Full details and administration controls for this user account.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col h-[80vh]">
              <div className="h-32 bg-gradient-to-r from-rose-500 to-purple-600 p-6 flex items-end">
                <div className="flex items-center gap-4 translate-y-8">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
                      {selectedUser.profile?.photos?.[0] ? (
                        <img src={selectedUser.profile.photos[0]} className="w-full h-full object-cover" />
                      ) : selectedUser.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">
                      {selectedUser.profile?.display_name || selectedUser.username}
                    </h2>
                    <p className="text-white/80 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-12">
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Account Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="User ID" value={selectedUser._id} />
                        <InfoItem label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                        <InfoItem label="Last Login" value={new Date(selectedUser.last_login).toLocaleString()} />
                        <InfoItem label="Role" value={selectedUser.role} highlight />
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Profile Details</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {selectedUser.profile?.bio || "No bio provided"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Age" value={selectedUser.profile?.age} />
                          <InfoItem label="Gender" value={selectedUser.profile?.gender} />
                          <InfoItem label="Location" value={selectedUser.profile?.location?.city} />
                          <InfoItem label="Verification" value={selectedUser.profile?.is_verified ? "Verified" : "Unverified"} />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-2">
                        <ActionButton label="Warn User" onClick={() => handleWarnUser(selectedUser._id)} />
                        <ActionButton label="Force Verify" onClick={() => handleForceVerification(selectedUser._id)} />
                        <ActionButton label="Grant Premium" onClick={() => handleGrantPremium(selectedUser._id)} />
                        
                        {user?.role === 'super_admin' && (
                          <>
                            <div className="pt-2">
                              <ActionButton 
                                label={selectedUser.status === 'suspended' ? 'Unsuspend Account' : (selectedUser.status === 'banned' ? 'Activate Account' : 'Suspend Account')} 
                                variant={selectedUser.status === 'active' ? 'warning' : 'success'}
                                onClick={() => handleUpdateStatus(selectedUser._id, selectedUser.status === 'active' ? 'suspended' : 'active')} 
                              />
                            </div>
                            <ActionButton 
                              label={selectedUser.status === 'banned' ? 'Unban User' : 'Ban User'} 
                              variant={selectedUser.status === 'banned' ? 'success' : 'danger'} 
                              onClick={() => handleUpdateStatus(selectedUser._id, selectedUser.status === 'banned' ? 'active' : 'banned')} 
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`p-6 rounded-3xl border ${selectedUser.risk_score > 50 ? 'bg-rose-50 border-rose-100' : 'bg-green-50 border-green-100'}`}>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Safety Score</h3>
                      <div className="text-3xl font-black mb-2">{selectedUser.risk_score}/100</div>
                      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedUser.risk_score > 50 ? 'bg-rose-500' : 'bg-green-500'}`}
                          style={{ width: `${selectedUser.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <Button onClick={() => setIsUserModalOpen(false)} variant="ghost" className="rounded-xl">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoItem = ({ label, value, highlight }) => (
  <div>
    <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
    <div className={`text-sm font-medium ${highlight ? 'text-rose-600 font-bold' : 'text-gray-900'}`}>
      {value?.toString() || "N/A"}
    </div>
  </div>
);

const ActionButton = ({ label, onClick, variant = 'default' }) => {
  const styles = {
    default: "hover:bg-gray-200 text-gray-700",
    warning: "hover:bg-amber-100 text-amber-700",
    success: "hover:bg-green-100 text-green-700",
    danger: "hover:bg-rose-100 text-rose-700 font-bold"
  };
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-colors ${styles[variant]}`}
    >
      {label}
    </button>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-rose-50 text-rose-600 font-semibold" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    <span className="text-sm">{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
  </button>
);

const StatCard = ({ title, value, icon, trend, trendDown, loading }) => (
  <Card className="border-gray-200">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
        {!loading && (
          <Badge className={trendDown ? "bg-rose-50 text-rose-600 hover:bg-rose-50 border-0" : "bg-green-50 text-green-600 hover:bg-green-50 border-0"}>
            {trend}
          </Badge>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      )}
      <p className="text-sm text-gray-500">{title}</p>
    </CardContent>
  </Card>
);

const AlertCard = ({ type, count, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-md cursor-pointer ${
    type === 'reported' ? 'bg-rose-50 border-rose-100' :
    type === 'content' ? 'bg-amber-50 border-amber-100' :
    'bg-blue-50 border-blue-100'
  }`}>
    <div className={`p-3 rounded-xl ${
      type === 'reported' ? 'bg-rose-100 text-rose-600' :
      type === 'content' ? 'bg-amber-100 text-amber-600' :
      'bg-blue-100 text-blue-600'
    }`}>
      {type === 'reported' ? <ShieldAlert className="w-6 h-6" /> :
       type === 'content' ? <AlertTriangle className="w-6 h-6" /> :
       <CheckCircle className="w-6 h-6" />}
    </div>
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <Badge className={`${
          type === 'reported' ? 'bg-rose-600' :
          type === 'content' ? 'bg-amber-600' :
          'bg-blue-600'
        } text-white`}>
          {count}
        </Badge>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const SettingRow = ({ label, description, checked, onCheckedChange, disabled }) => (
  <div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
    <div className="space-y-0.5">
      <div className="text-sm font-bold text-gray-900">{label}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
    <Switch 
      checked={checked} 
      onCheckedChange={onCheckedChange} 
      disabled={disabled}
      className="data-[state=checked]:bg-rose-500"
    />
  </div>
);

export default AdminDashboard;
