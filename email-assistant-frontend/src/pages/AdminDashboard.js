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
  Chip,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import { 
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon, 
  Logout as LogoutIcon, 
  MailOutline as EmailIcon,
  FilterList as FilterIcon,
  ErrorOutline as ErrorIcon,
  Close as CloseIcon,
  PersonOutline as PersonIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const UserCard = ({ user, onViewLogs }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card 
      variant="outlined"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.08)',
          borderColor: '#60a5fa',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
          transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 0.3s ease',
          transformOrigin: 'left',
        }
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: 1,
        p: 3
      }}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 600,
              border: '3px solid #ffffff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
            }}
          >
            {user.email[0].toUpperCase()}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
        </Box>
        
        <Typography 
          variant="h6" 
          align="center"
          sx={{ 
            fontWeight: 600,
            color: '#1e293b',
            mb: 0.5,
            fontSize: '1.1rem'
          }}
        >
          {user.email}
        </Typography>
        
        <Chip
          label={`ID: ${user.id}`}
          size="small"
          sx={{
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            fontSize: '0.75rem',
            fontWeight: 500,
            mb: 2,
            border: '1px solid #dbeafe'
          }}
        />
        
        <Box sx={{ mt: 'auto', width: '100%' }}>
          <Divider sx={{ mb: 2, opacity: 0.6 }} />
          <Box 
            onClick={() => onViewLogs(user.id)}
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              backgroundColor: isHovered ? '#3b82f6' : '#f1f5f9',
              color: isHovered ? 'white' : '#3b82f6',
              transition: 'all 0.2s ease',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#2563eb',
                color: 'white',
              }
            }}
          >
            <EmailIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="button" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
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

  const getActionColor = (action) => {
    const colors = {
      'sent': '#22c55e',
      'received': '#3b82f6',
      'failed': '#ef4444',
      'pending': '#f59e0b'
    };
    return colors[action.toLowerCase()] || '#64748b';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Email Interaction Logs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={logs.length} color="secondary" sx={{ mr: 2 }}>
              <FilterIcon />
            </Badge>
            <IconButton 
              onClick={onClose}
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {paginatedLogs.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              py: 6,
              color: '#64748b'
            }}>
              <EmailIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                No logs found
              </Typography>
            </Box>
          ) : (
            paginatedLogs.map((log, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: 3, 
                  p: 3, 
                  background: 'linear-gradient(135deg, #f4f6f8 0%, #e8eaed 100%)',
                  borderRadius: 2,
                  border: '1px solid #d1d9e0',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: getActionColor(log.action),
                    borderRadius: '0 2px 2px 0',
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={log.action}
                    size="small"
                    sx={{
                      backgroundColor: getActionColor(log.action),
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      fontWeight: 500,
                      backgroundColor: '#ffffff',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      border: '1px solid #d1d9e0'
                    }}
                  >
                    {format(new Date(log.timestamp), 'MMM dd, yyyy • hh:mm a')}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#334155',
                    lineHeight: 1.6,
                    fontSize: '0.875rem'
                  }}
                >
                  {log.email_content}
                </Typography>
              </Box>
            ))
          )}
        </Box>
        
        {paginatedLogs.length > 0 && (
          <Box sx={{ 
            borderTop: '1px solid #d1d9e0',
            backgroundColor: '#f4f6f8'
          }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={logs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  paddingLeft: 3,
                  paddingRight: 3,
                }
              }}
            />
          </Box>
        )}
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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header */}
          <Box sx={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            p: 4
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'rgba(255, 255, 255, 0.1)',
                  mr: 3
                }}>
                  <AdminIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Admin Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Manage users and monitor email interactions
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  variant="outlined"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ 
                    width: 280,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'white' },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Tooltip title="Logout">
                  <IconButton 
                    onClick={handleLogout}
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4 }}>
            {/* Stats Bar */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4,
              p: 3,
              backgroundColor: '#fafbfc',
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 2, color: '#6366f1' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569' }}>
                    {filteredUsers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {filteredUsers.length === 1 ? 'User' : 'Users'} {searchTerm && 'found'}
                  </Typography>
                </Box>
              </Box>
              
              {searchTerm && (
                <Chip
                  label={`Searching: "${searchTerm}"`}
                  onDelete={() => setSearchTerm("")}
                  sx={{
                    backgroundColor: '#6366f1',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { color: 'white' }
                    }
                  }}
                />
              )}
            </Box>

            {loading ? (
              <Grid container spacing={3}>
                {[...Array(6)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Skeleton 
                      variant="rectangular" 
                      height={280} 
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <>
                {filteredUsers.length === 0 ? (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: 400,
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: 3,
                      border: '2px dashed #cbd5e1',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                      No users found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                      {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredUsers.map((user, index) => (
                      <Grid item xs={12} sm={6} md={4} key={user.id}>
                        <Fade in={true} timeout={300 + index * 100}>
                          <div>
                            <UserCard 
                              user={user} 
                              onViewLogs={fetchUserLogs} 
                            />
                          </div>
                        </Fade>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Paper>

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
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}
            icon={<ErrorIcon />}
          >
            {errorMessage}
          </MuiAlert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
