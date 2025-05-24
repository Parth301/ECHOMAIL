import React, { useState, useRef, useMemo, useCallback } from "react";
import api from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress, 
  Tabs, 
  Tab, 
  IconButton, 
  TextField, 
  Tooltip,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip
} from "@mui/material";
import { 
  Send as SendIcon,  
  FileUpload as FileUploadIcon,
  AutoFixHigh as GenerateIcon,
  Tune as RefineIcon,
  ContentCopy as CopyIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  AttachFile as AttachmentIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

const EmailAssistant = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // State Declarations
  const [tab, setTab] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [emailText, setEmailText] = useState("");
  const [refinedEmail, setRefinedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const handleBackToDashboard = () => {
    navigate('/dashboard');  // Adjust the path as needed
  };

  // Advanced Settings State
  const [advancedSettings, setAdvancedSettings] = useState({
    tone: "professional",
    length: "medium",
    language: "English"
  });

  // Refs
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // Memoized Snackbar Function
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Form Reset Handler
  const resetForm = useCallback(() => {
    setPrompt("");
    setEmailText("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  }, []);

  // Tab Change Handler
  const handleTabChange = useCallback((event, newValue) => {
    setTab(newValue);
    resetForm();
  }, [resetForm]);

  // Snackbar Close Handler
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Clipboard Copy Handler
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showSnackbar("Copied to clipboard!", "info");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showSnackbar("Failed to copy", "error");
    });
  }, [showSnackbar]);

  // Email Generation Handler
  const generateEmail = async () => {
    if (!prompt) {
      showSnackbar("Please enter a prompt.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        `/email/generate`,
        { 
          prompt,
          tone: advancedSettings.tone,
          length: advancedSettings.length,
          language: advancedSettings.language
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (!response.data || !response.data.email_content) {
        throw new Error("Empty response from backend");
      }

      setGeneratedEmail(response.data.email_content);
      showSnackbar("Email generated successfully!");
    } catch (error) {
      console.error("Error in generateEmail:", error);
      showSnackbar(`Error generating email: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Email Refinement Handler
  const refineEmail = async () => {
    if (!file && !emailText) {
      showSnackbar("Please enter text or upload a file.", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    } else {
      formData.append("text", emailText);
    }

    formData.append("tone", advancedSettings.tone);
    formData.append("length", advancedSettings.length);
    formData.append("language", advancedSettings.language);

    try {
      const response = await api.post(
        "/email/refine",
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (!response.data || !response.data.refined_email) {
        throw new Error("Empty response from backend");
      }

      setRefinedEmail(response.data.refined_email);
      showSnackbar("Email refined successfully!");
    } catch (error) {
      console.error("Error in refineEmail:", error);
      showSnackbar(`Error refining email: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle attachment files
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleGoToHistory = () => {
    navigate('/email-history');  // Adjust the path to your actual history page route
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Email Sending Handler with attachments
  const sendEmail = async () => {
    const emailBody = tab === 0 ? generatedEmail : refinedEmail;

    if (!recipient || !subject || !emailBody) {
      showSnackbar("Recipient, subject, and email content are required.", "error");
      return;
    }

    setSending(true);
    try {
      // Create FormData for sending files
      const formData = new FormData();
      formData.append("recipient", recipient);
      formData.append("subject", subject);
      formData.append("email_content", emailBody);
      
      // Add attachments
      attachments.forEach(file => {
        formData.append("attachments", file);
      });

      const response = await api.post(
        "/email/send",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data"
          } 
        }
      );

      showSnackbar(response.data.message || "Email sent successfully!");
      resetForm();
    } catch (error) {
      console.error("Error in sendEmail:", error);
      showSnackbar(`Error sending email: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  // File and Text Clearing Handlers
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  // Email Statistics Calculation
  const emailStats = useMemo(() => {
    const currentEmail = tab === 0 ? generatedEmail : refinedEmail;
    return {
      characters: currentEmail.length,
      words: currentEmail.trim().split(/\s+/).filter(Boolean).length,
      readTime: Math.ceil(currentEmail.trim().split(/\s+/).filter(Boolean).length / 200)
    };
  }, [generatedEmail, refinedEmail, tab]);

  // Preview Modal Component
  const PreviewModal = () => (
    <Dialog 
      open={previewOpen} 
      onClose={() => setPreviewOpen(false)}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius * 2,
          overflow: 'hidden',
          maxHeight: '90vh'
        }
      }}
      aria-labelledby="email-preview-title"
    >
      <DialogTitle id="email-preview-title" sx={{ 
        background: 'linear-gradient(90deg, #f5faff 0%, #e1edfd 100%)', 
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 2
      }}>
        Email Preview
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isTablet ? 'flex-start' : 'center', 
            flexDirection: isTablet ? 'column' : 'row',
            gap: isTablet ? 2 : 0,
            mb: 3
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 500,
                wordBreak: 'break-word'
              }}
            >
              <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9em' }}>Subject:</Box>
              {subject || "(No subject)"}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flexShrink: 0
            }}>
              <Chip 
                icon={<AttachmentIcon fontSize="small" />} 
                label={`${attachments.length} ${attachments.length === 1 ? 'attachment' : 'attachments'}`}
                size="small"
                variant="outlined"
                sx={{ visibility: attachments.length > 0 ? 'visible' : 'hidden' }}
              />
              <Tooltip title="Copy to Clipboard">
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    copyToClipboard(tab === 0 ? generatedEmail : refinedEmail);
                    setPreviewOpen(false);
                  }}
                  startIcon={<CopyIcon />}
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 3,
                    textTransform: 'none'
                  }}
                  aria-label="Copy email content"
                >
                  Copy Email
                </Button>
              </Tooltip>
            </Box>
          </Box>
          
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
            aria-label="Email content preview"
          >
            {tab === 0 ? generatedEmail : refinedEmail}
          </Paper>
          
          {attachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                Attachments
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                maxHeight: '15vh',
                overflowY: 'auto',
                p: 1
              }}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${formatFileSize(file.size)})`}
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                    icon={<AttachmentIcon fontSize="small" />}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
        <Button 
          onClick={() => setPreviewOpen(false)} 
          color="primary"
          variant="contained"
          sx={{ 
            borderRadius: theme.shape.borderRadius * 3, 
            textTransform: 'none', 
            px: 3 
          }}
        >
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Settings Modal Component
  const SettingsModal = () => (
    <Dialog 
      open={settingsOpen} 
      onClose={() => setSettingsOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius * 1.5,
        }
      }}
      aria-labelledby="settings-dialog-title"
    >
      <DialogTitle id="settings-dialog-title">Email Generation Settings</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Tone"
            value={advancedSettings.tone}
            onChange={(e) => setAdvancedSettings(prev => ({
              ...prev, 
              tone: e.target.value
            }))}
            variant="outlined"
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { maxHeight: 200 }
                }
              }
            }}
          >
            {['professional', 'friendly', 'formal', 'casual'].map((option) => (
              <MenuItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Length"
            value={advancedSettings.length}
            onChange={(e) => setAdvancedSettings(prev => ({
              ...prev, 
              length: e.target.value
            }))}
            variant="outlined"
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { maxHeight: 200 }
                }
              }
            }}
          >
            {['short', 'medium', 'long'].map((option) => (
              <MenuItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Language"
            value={advancedSettings.language}
            onChange={(e) => setAdvancedSettings(prev => ({
              ...prev, 
              language: e.target.value
            }))}
            variant="outlined"
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { maxHeight: 200 }
                }
              }
            }}
          >
            {['English', 'Spanish', 'German', 'French'].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={() => setSettingsOpen(false)} 
          color="primary"
          variant="contained"
          sx={{ 
            borderRadius: theme.shape.borderRadius * 3,
            textTransform: 'none'
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Help Modal Component
  const HelpModal = () => (
    <Dialog 
      open={helpOpen} 
      onClose={() => setHelpOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius * 1.5,
        }
      }}
      aria-labelledby="help-dialog-title"
    >
      <DialogTitle id="help-dialog-title">AI Email Assistant Guide</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" paragraph>
          🚀 Welcome to the AI Email Assistant! Here's how to use it:
        </Typography>
        <Typography variant="body2" paragraph>
          1. Generate Tab: Enter a prompt describing your email, and let AI draft it for you.
        </Typography>
        <Typography variant="body2" paragraph>
          2. Refine Tab: Upload a document or paste text to improve and polish your email.
        </Typography>
        <Typography variant="body2" paragraph>
          3. Add attachments using the attachment button below the email content.
        </Typography>
        <Typography variant="body2" paragraph>
          4. Use the preview, copy, and settings buttons to customize your email.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pro Tip: Adjust tone, length, and language settings for personalized emails!
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={() => setHelpOpen(false)} 
          color="primary"
          variant="contained"
          sx={{ 
            borderRadius: theme.shape.borderRadius * 3,
            textTransform: 'none'
          }}
        >
          Got It!
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 4,
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f0f4f8'  // Light blue-gray background for the page
      }}
    >
      {/* App Header with Controls */}
      <Paper 
        elevation={4} 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 3,
          background: 'linear-gradient(90deg, rgba(63,81,181,0.15) 0%, rgba(25,118,210,0.25) 100%)', // Stronger gradient
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 2,
          border: '1px solid rgba(63,81,181,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            color="primary"
            onClick={handleBackToDashboard}
            aria-label="Back to dashboard"
            sx={{ 
              backgroundColor: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              '&:hover': { backgroundColor: '#f5f5f5', transform: 'translateY(-2px)' },
              transition: 'transform 0.2s'
            }}
          >
            <DashboardIcon />
          </IconButton>
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 700,
              color: '#1e3a8a', // Deeper blue for better contrast
              flexGrow: 1
            }}
          >
            Email Assistant
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, justifySelf: 'flex-end' }}>
        <Tooltip title="Email History">
    <IconButton 
      onClick={handleGoToHistory}
      color="primary"
      aria-label="Email History"
      sx={{ 
        backgroundColor: 'rgba(255,255,255,0.7)',
        '&:hover': { backgroundColor: 'white' }
      }}
    >
      <HistoryIcon />
    </IconButton>
  </Tooltip>
          <Tooltip title="Settings">
            <IconButton 
              onClick={() => setSettingsOpen(true)}
              color="primary"
              aria-label="Settings"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.7)',
                '&:hover': { backgroundColor: 'white' }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Help Guide">
            <IconButton 
              onClick={() => setHelpOpen(true)}
              color="secondary"
              aria-label="Help"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.7)',
                '&:hover': { backgroundColor: 'white' }
              }}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
  
      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isTablet ? 'column' : 'row',
        gap: 3,
        flexGrow: 1
      }}>
        {/* Left Column - Controls */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: isTablet ? '100%' : '35%',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e7ff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {/* Tab Selection */}
          <Tabs 
            value={tab} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: '#e8f0fe', // Light blue background for tabs
              '& .MuiTabs-indicator': {
                backgroundColor: '#1e40af', // Bolder blue for the indicator
                height: 3
              }
            }}
          >
            <Tab 
              label="Generate" 
              icon={<GenerateIcon fontSize="small" />} 
              iconPosition="start"
              sx={{ 
                py: 2,
                fontWeight: 600,
                color: tab === 0 ? '#1e40af' : 'text.secondary'
              }}
            />
            <Tab 
              label="Refine" 
              icon={<RefineIcon fontSize="small" />} 
              iconPosition="start"
              sx={{ 
                py: 2,
                fontWeight: 600,
                color: tab === 1 ? '#1e40af' : 'text.secondary'
              }}
            />
          </Tabs>
  
          {/* Content based on selected tab */}
          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', backgroundColor: 'white' }}>
            {tab === 0 ? (
              <Box sx={{ opacity: 1, transition: 'opacity 0.3s' }}>
                <Typography variant="subtitle2" gutterBottom color="#3b82f6" fontWeight={600}>
                  What kind of email do you need?
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  placeholder="e.g., Write a professional email to schedule a meeting with my team about the upcoming project deadline"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  variant="outlined"
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#cbd5e1',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      }
                    }
                  }}
                />
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary" 
                  onClick={generateEmail} 
                  disabled={!prompt || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#2563eb', // Bold blue
                    fontWeight: 600,
                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                      boxShadow: '0 6px 8px rgba(37, 99, 235, 0.3)',
                    }
                  }}
                >
                  {loading ? "Generating..." : "Generate Email"}
                </Button>
              </Box>
            ) : (
              <Box sx={{ opacity: 1, transition: 'opacity 0.3s' }}>
                <Typography variant="subtitle2" gutterBottom color="#8b5cf6" fontWeight={600}>
                  Refine an existing email
                </Typography>
                
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  border: '1px dashed #8b5cf6',
                  borderRadius: 2,
                  backgroundColor: 'rgba(139, 92, 246, 0.05)'
                }}>
                  <Button
                    fullWidth
                    variant="text"
                    component="label"
                    startIcon={<FileUploadIcon />}
                    sx={{ 
                      py: 2,
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      color: '#8b5cf6',
                      fontWeight: 600,
                    }}
                    disabled={!!emailText}
                  >
                    {file ? `Selected: ${file.name}` : "Upload a file (.txt, .pdf, .docx)"}
                    <input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      onChange={(e) => {
                        setFile(e.target.files[0]);
                        setEmailText("");
                      }}
                      accept=".txt,.pdf,.docx"
                      disabled={!!emailText}
                    />
                  </Button>
                  
                  {file && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip 
                        label={file.name} 
                        onDelete={clearFile}
                        size="small"
                        color="secondary"
                        sx={{
                          backgroundColor: '#8b5cf6',
                          borderColor: '#8b5cf6',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  )}
                </Box>
                
                <Typography 
                  variant="body2" 
                  align="center" 
                  sx={{ 
                    my: 1, 
                    color: 'text.secondary',
                    fontWeight: 600
                  }}
                >
                  — OR —
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  label="Paste email text"
                  placeholder="Paste your existing email text here for refinement"
                  value={emailText}
                  onChange={(e) => {
                    setEmailText(e.target.value);
                    setFile(null);
                  }}
                  disabled={!!file}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#cbd5e1',
                      },
                      '&:hover fieldset': {
                        borderColor: '#8b5cf6',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#8b5cf6',
                    }
                  }}
                />
                
                <Button 
                  fullWidth
                  variant="contained" 
                  color="secondary" 
                  onClick={refineEmail}
                  disabled={loading || (!file && !emailText)}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefineIcon />}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#8b5cf6', // Bold purple
                    fontWeight: 600,
                    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.25)',
                    '&:hover': {
                      backgroundColor: '#7c3aed',
                      boxShadow: '0 6px 8px rgba(139, 92, 246, 0.35)',
                    }
                  }}
                >
                  {loading ? "Refining..." : "Refine Email"}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
  
        {/* Right Column - Email Content & Send Options */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: isTablet ? '100%' : '65%',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e7ff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header with basic info */}
          <Box 
            sx={{
              backgroundColor: tab === 0 ? 'rgba(37, 99, 235, 0.08)' : 'rgba(139, 92, 246, 0.08)',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ color: tab === 0 ? '#2563eb' : '#8b5cf6' }}
            >
              {tab === 0 ? "Generated Email" : "Refined Email"}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(generatedEmail || refinedEmail) && (
                <>
                  <Tooltip title="Preview">
                    <IconButton 
                      size="small" 
                      onClick={() => setPreviewOpen(true)}
                      aria-label="Preview email"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        '&:hover': { backgroundColor: 'white' }
                      }}
                    >
                      <PreviewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(tab === 0 ? generatedEmail : refinedEmail)}
                      color={copied ? "success" : "default"}
                      aria-label="Copy to clipboard"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        '&:hover': { backgroundColor: 'white' }
                      }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          {/* Email content area */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              overflowY: 'auto',
              backgroundColor: '#f8fafc' // Very light blue-gray background
            }}
          >
            {loading ? (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}
                aria-live="polite"
                aria-busy={loading}
              >
                <CircularProgress sx={{ color: tab === 0 ? '#2563eb' : '#8b5cf6' }} />
                <Typography variant="body2" sx={{ color: tab === 0 ? '#2563eb' : '#8b5cf6', fontWeight: 500 }}>
                  {tab === 0 ? "Creating your email..." : "Improving your content..."}
                </Typography>
              </Box>
            ) : (generatedEmail || refinedEmail) ? (
              <Box>
                {/* Email content display */}
                <TextField
                  fullWidth
                  multiline
                  minRows={12}
                  value={tab === 0 ? generatedEmail : refinedEmail}
                  onChange={(e) => 
                    tab === 0 
                      ? setGeneratedEmail(e.target.value) 
                      : setRefinedEmail(e.target.value)
                  }
                  variant="outlined"
                  sx={{ 
                    mb: 2,
                    backgroundColor: '#ffffff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: tab === 0 ? 'rgba(37, 99, 235, 0.3)' : 'rgba(139, 92, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: tab === 0 ? '#2563eb' : '#8b5cf6',
                      },
                    },
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                />
                
                {/* Email statistics */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: 2, 
                    mb: 2
                  }}
                >
                  <Chip 
                    size="small" 
                    label={`${emailStats.characters} characters`}
                    variant="outlined"
                    sx={{ 
                      borderColor: tab === 0 ? '#93c5fd' : '#c4b5fd',
                      backgroundColor: tab === 0 ? 'rgba(147, 197, 253, 0.1)' : 'rgba(196, 181, 253, 0.1)',
                      fontWeight: 500,
                      color: tab === 0 ? '#2563eb' : '#8b5cf6'
                    }}
                  />
                  <Chip 
                    size="small" 
                    label={`${emailStats.words} words`}
                    variant="outlined"
                    sx={{ 
                      borderColor: tab === 0 ? '#93c5fd' : '#c4b5fd',
                      backgroundColor: tab === 0 ? 'rgba(147, 197, 253, 0.1)' : 'rgba(196, 181, 253, 0.1)',
                      fontWeight: 500,
                      color: tab === 0 ? '#2563eb' : '#8b5cf6'
                    }}
                  />
                  <Chip 
                    size="small" 
                    label={`~${emailStats.readTime} min read`}
                    variant="outlined"
                    sx={{ 
                      borderColor: tab === 0 ? '#93c5fd' : '#c4b5fd',
                      backgroundColor: tab === 0 ? 'rgba(147, 197, 253, 0.1)' : 'rgba(196, 181, 253, 0.1)',
                      fontWeight: 500,
                      color: tab === 0 ? '#2563eb' : '#8b5cf6'
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  opacity: 0.85
                }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  maxWidth: 400,
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'white',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: '1px solid',
                  borderColor: tab === 0 ? 'rgba(37, 99, 235, 0.2)' : 'rgba(139, 92, 246, 0.2)'
                }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600, color: tab === 0 ? '#2563eb' : '#8b5cf6' }}>
                    {tab === 0 
                      ? "Enter a prompt to generate an email" 
                      : "Upload or paste an email to refine"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tab === 0 
                      ? "The AI will create an email based on your description" 
                      : "The AI will improve the style, tone, and clarity of your email"}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Send email section */}
          {(generatedEmail || refinedEmail) && (
            <Box 
              sx={{ 
                p: 3, 
                borderTop: 1, 
                borderColor: 'divider',
                backgroundColor: '#f0f9ff' // Light blue background
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2, 
                  color: '#0369a1', // Deep blue for text
                  fontWeight: 600
                }}
              >
                Ready to send
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
                gap: 2,
                mb: 2
              }}>
                <TextField
                  label="To"
                  placeholder="recipient@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#bae6fd',
                      },
                      '&:hover fieldset': {
                        borderColor: '#0ea5e9',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0369a1',
                    }
                  }}
                />
                
                <TextField
                  label="Subject"
                  placeholder="Enter subject line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#bae6fd',
                      },
                      '&:hover fieldset': {
                        borderColor: '#0ea5e9',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0369a1',
                    }
                  }}
                />
              </Box>
              
              {/* Attachments section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body2" color="#0369a1" fontWeight={500}>
                    Attachments ({attachments.length})
                  </Typography>
                  
                  <Button
                    size="small"
                    startIcon={<AttachmentIcon />}
                    component="label"
                    sx={{
                      color: '#0ea5e9',
                      '&:hover': {
                        backgroundColor: 'rgba(14, 165, 233, 0.08)'
                      }
                    }}
                  >
                    Add Files
                    <input
                      type="file"
                      hidden
                      ref={attachmentInputRef}
                      onChange={handleAttachmentChange}
                      multiple
                    />
                  </Button>
                </Box>
                
                {attachments.length > 0 && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1,
                      maxHeight: '100px',
                      overflowY: 'auto',
                      p: 1,
                      bgcolor: 'white',
                      borderRadius: 1,
                      border: '1px solid #bae6fd'
                    }}
                  >
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        size="small"
                        onDelete={() => removeAttachment(index)}
                        variant="outlined"
                        sx={{
                          borderColor: '#7dd3fc',
                          backgroundColor: 'rgba(125, 211, 252, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(125, 211, 252, 0.2)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              
              <Button 
                fullWidth
                variant="contained" 
                color="success" 
                onClick={sendEmail}
                disabled={sending || !recipient || !subject}
                endIcon={<SendIcon />}
                sx={{ 
                  py: 1.2,
                  borderRadius: 2,
                  backgroundColor: '#059669', // Strong teal green
                  fontWeight: 600,
                  boxShadow: '0 4px 6px rgba(5, 150, 105, 0.25)',
                  '&:hover': {
                    backgroundColor: '#047857',
                    boxShadow: '0 6px 8px rgba(5, 150, 105, 0.35)',
                  }
                }}
              >
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
  
      {/* Dialogs/Modals */}
      <PreviewModal />
      <SettingsModal />
      <HelpModal />
  
      {/* Feedback/Notification System */}
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

export default EmailAssistant;
