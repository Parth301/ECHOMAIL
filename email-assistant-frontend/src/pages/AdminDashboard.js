import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  InputAdornment,
  Fade,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  TablePagination,
  Skeleton,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import { 
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon, 
  Logout as LogoutIcon, 
  MailOutline as EmailIcon,
  FilterList as FilterIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const UserCard = ({ user, onViewLogs }) => {
  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: 1 
      }}>
        <Avatar 
          sx={{ 
            width: 72, 
            height: 72, 
            mb: 2,
            bgcolor: 'primary.light',
            color: 'primary.contrastText'
          }}
        >
          {user.email[0].toUpperCase()}
        </Avatar>
        <Typography variant="h6" align="center">
          {user.email}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          User ID: {user.id}
        </Typography>
        <Box sx={{ mt: 'auto', width: '100%' }}>
          <Divider sx={{ mb: 2 }} />
          <Box 
            onClick={() => onViewLogs(user.id)}
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              py: 1,
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <EmailIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="button" color="primary">
              View Logs
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const LogDialog = ({ open, onClose, logs }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLogs = useMemo(() => {
    return logs.slice(
      page * rowsPerPage, 
      page * rowsPerPage + rowsPerPage
    );
  }, [logs, page, rowsPerPage]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Email Interaction Logs</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {logs.length} Total Logs
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {paginatedLogs.map((log, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 2 
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" color="primary">
                {log.action}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm a')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.primary">
              {log.email_content}
            </Typography>
          </Box>
        ))}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </DialogContent>
    </Dialog>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  
  const navigate = useNavigate();

  // Consolidated error handling function
  const handleError = (message) => {
    setErrorMessage(message);
    setOpenErrorSnackbar(true);
    setLoading(false);
  };

  const handleCloseErrorSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenErrorSnackbar(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (!token || !isAdmin) {
      localStorage.removeItem("token");
      localStorage.removeItem("is_admin");
      navigate("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setUsers(response.data);
        setFilteredUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch Users Error:", err);
        
        if (err.response && err.response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("is_admin");
          navigate("/login");
        }

        handleError(err.response?.data?.error || "Failed to fetch users");
      }
    };

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUserLogs = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      const logsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/logs/${userId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setLogs(logsResponse.data);
      setSelectedUser(userId);
    } catch (err) {
      console.error("Fetch Logs Error:", err);
      handleError(err.response?.data?.error || "Failed to fetch user logs");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    navigate("/login");
  };

  const handleCloseLogsDialog = () => {
    setSelectedUser(null);
    setLogs([]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper 
        elevation={4} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #f0f4f8 0%, #e6eaf3 100%)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
            <Typography variant="h4" color="primary">
              Admin Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2, width: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Box 
              onClick={handleLogout}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                p: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} color="secondary" />
              <Typography variant="button" color="secondary">
                Logout
              </Typography>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rectangular" height={300} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: 300,
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredUsers.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <UserCard 
                      user={user} 
                      onViewLogs={fetchUserLogs} 
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        <LogDialog 
          open={!!selectedUser}
          onClose={handleCloseLogsDialog}
          logs={logs}
        />

        {/* Error Snackbar */}
        <Snackbar
          open={openErrorSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseErrorSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleCloseErrorSnackbar}
            severity="error"
            sx={{ width: '100%' }}
            icon={<ErrorIcon />}
          >
            {errorMessage}
          </MuiAlert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;