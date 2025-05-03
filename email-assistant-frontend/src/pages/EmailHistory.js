import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "axios";
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  IconButton, 
  Tooltip, 
  CircularProgress,
  Chip,
  Button,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { 
  History as HistoryIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon,
  EditNote as EditNoteIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorIcon
} from "@mui/icons-material";

const EmailHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // State declarations
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Navigation handlers
  const handleGoToEmailGeneration = () => {
    navigate('/email-generation');
  };

  // Fetch logs from API
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/userlogs/my-logs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (response.data) {
        // Format timestamps
        const formattedLogs = response.data.map(log => ({
          ...log,
          formattedTime: new Date(log.timestamp).toLocaleString()
        }));
        setLogs(formattedLogs);
      }
    } catch (err) {
      console.error("Error fetching email logs:", err);
      setError(err.response?.data?.error || "Failed to load email history");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load logs on component mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Table pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Email view dialog handlers
  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  // Snackbar handlers
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Copy to clipboard handler
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showSnackbar("Email content copied to clipboard!", "success");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showSnackbar("Failed to copy content", "error");
    });
  };

  // Get action chip color
  const getActionChipColor = (action) => {
    switch(action) {
      case 'generate':
        return { bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderColor: '#93c5fd' };
      case 'refine':
        return { bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderColor: '#c4b5fd' };
      case 'send':
        return { bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', borderColor: '#6ee7b7' };
      default:
        return { bgcolor: 'rgba(75, 85, 99, 0.1)', color: '#4b5563', borderColor: '#d1d5db' };
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch(action) {
      case 'generate':
        return <EditNoteIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 'refine':
        return <FilterIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 'send':
        return <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />;
      default:
        return <HistoryIcon fontSize="small" sx={{ mr: 0.5 }} />;
    }
  };

  // Email preview/view dialog
  const EmailViewDialog = () => {
    if (!selectedEmail) return null;
    
    return (
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.shape.borderRadius * 2,
            overflow: 'hidden',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(90deg, #f5faff 0%, #e1edfd 100%)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getActionIcon(selectedEmail.action)}
            <Typography variant="h6" component="span" sx={{ fontWeight: 500 }}>
              {selectedEmail.action.charAt(0).toUpperCase() + selectedEmail.action.slice(1)} Email
            </Typography>
          </Box>
          <Box>
            <Chip 
              size="small"
              label={new Date(selectedEmail.timestamp).toLocaleString()}
              sx={{ 
                bgcolor: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6',
                fontWeight: 500,
                mr: 1
              }}
            />
            <IconButton size="small" onClick={handleCloseViewDialog} aria-label="close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Paper
              elevation={0}
              sx={{ 
                whiteSpace: 'pre-wrap', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: theme.shape.borderRadius,
                p: 3,
                maxHeight: '50vh',
                overflowY: 'auto',
                backgroundColor: '#fff',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                fontSize: '0.95rem',
                lineHeight: 1.7
              }}
            >
              {selectedEmail.email_content}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            startIcon={<CopyIcon />}
            onClick={() => copyToClipboard(selectedEmail.email_content)}
            sx={{ 
              borderRadius: theme.shape.borderRadius * 3,
              textTransform: 'none'
            }}
          >
            Copy Content
          </Button>
          <Button 
            variant="contained"
            onClick={handleCloseViewDialog}
            sx={{ 
              borderRadius: theme.shape.borderRadius * 3, 
              textTransform: 'none', 
              px: 3 
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 4,
        minHeight: '90vh',
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f0f4f8'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={4} 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 3,
          background: 'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.25) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 2,
          border: '1px solid rgba(59,130,246,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            color="primary"
            onClick={handleGoToEmailGeneration}
            aria-label="Back to email generator"
            sx={{ 
              backgroundColor: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              '&:hover': { backgroundColor: '#f5f5f5', transform: 'translateY(-2px)' },
              transition: 'transform 0.2s'
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 700,
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <HistoryIcon fontSize={isMobile ? "small" : "medium"} />
              Email History
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(30, 58, 138, 0.7)',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Browse and manage your past emails
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e0e7ff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <CircularProgress sx={{ color: '#3b82f6' }} />
            <Typography variant="body2" color="text.secondary">
              Loading your email history...
            </Typography>
          </Box>
        ) : error ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 48 }} />
            <Typography variant="body1" color="error">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={fetchLogs}
              startIcon={<SearchIcon />}
              sx={{ mt: 2, borderRadius: theme.shape.borderRadius * 3 }}
            >
              Try Again
            </Button>
          </Box>
        ) : logs.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '50%', 
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2
              }}
            >
              <HistoryIcon sx={{ fontSize: 48, color: '#3b82f6' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
              No Email History Found
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
              Once you start generating or refining emails, they will appear here
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleGoToEmailGeneration}
              sx={{ 
                mt: 3, 
                borderRadius: theme.shape.borderRadius * 3,
                textTransform: 'none',
                fontWeight: 600
              }}
              startIcon={<EditNoteIcon />}
            >
              Create Your First Email
            </Button>
          </Box>
        ) : (
          <>
            <Box 
              sx={{ 
                p: 2, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                Your Email History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              </Typography>
            </Box>
            
            <TableContainer 
              sx={{ 
                maxHeight: `calc(100vh - 300px)`,
                minHeight: '300px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px'
                }
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Content Preview
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => {
                      const chipStyles = getActionChipColor(log.action);
                      return (
                        <TableRow 
                          key={log.id}
                          hover
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.05)' }
                          }}
                          onClick={() => handleViewEmail(log)}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {log.formattedTime}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                              size="small"
                              icon={getActionIcon(log.action)}
                              sx={{ 
                                bgcolor: chipStyles.bgcolor,
                                color: chipStyles.color,
                                fontWeight: 500,
                                border: '1px solid',
                                borderColor: chipStyles.borderColor
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                color: 'text.secondary',
                                maxWidth: isTablet ? '150px' : '300px'
                              }}
                            >
                              {log.email_content.substring(0, 150)}
                              {log.email_content.length > 150 ? '...' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title="View Email">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewEmail(log);
                                  }}
                                  sx={{ 
                                    color: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
                                  }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Copy Content">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(log.email_content);
                                  }}
                                  sx={{ 
                                    color: '#6366f1',
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.2)' }
                                  }}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={logs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ 
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(59, 130, 246, 0.05)'
              }}
            />
          </>
        )}
      </Paper>

      {/* Email View Dialog */}
      <EmailViewDialog />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmailHistory;
