import { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Input,
  Button,
  Text,
  Container,
  useToast,
  Textarea,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Badge,
  Divider,
  Progress,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  Link,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Avatar,
  Tag,
  TagLabel,
  TagLeftIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import axios from 'axios'
import { 
  FiGithub, 
  FiSearch, 
  FiMessageSquare, 
  FiZap, 
  FiCode, 
  FiBookOpen,
  FiArrowRight,
  FiStar,
  FiUsers,
  FiDownload,
  FiPlay,
  FiCheckCircle,
  FiInfo,
  FiFile,
  FiFolder,
  FiCpu,
  FiDatabase,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiHash,
  FiTag,
  FiMoon,
  FiSun,
  FiExternalLink,
  FiGlobe,
  FiTrendingUp,
  FiShield,
  FiLayers,
  FiCommand,
  FiTerminal,
  FiGitBranch,
  FiGitCommit,
  FiGitPullRequest,
  FiAlertCircle,
  FiClock,
  FiActivity,
  FiBarChart,
  FiPieChart,
  FiGrid,
  FiList,
  FiMaximize2,
  FiMinimize2,
  FiX,
  FiUser,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface CodeStructure {
  imports?: string[];
  functions?: Array<{
    name: string;
    line: number;
    args: string[];
    docstring: string;
  }>;
  classes?: Array<{
    name: string;
    line: number;
    methods: Array<{
      name: string;
      line: number;
      args: string[];
      docstring: string;
    }>;
    docstring: string;
  }>;
  type?: string;
  size?: number;
  lines?: number;
  error?: string;
}

interface Stats {
  total_files: number;
  python_files: number;
  js_files: number;
  total_functions: number;
  total_classes: number;
  languages?: Record<string, number>;
}

interface AnalyzeResponse {
  summary: string;
  readme: string;
  code_structure: Record<string, CodeStructure>;
  stats: Stats;
}

interface QuestionResponse {
  answer: string;
  context_files: string[];
}

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [question, setQuestion] = useState('')
  const [summary, setSummary] = useState('')
  const [readme, setReadme] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [codeStructure, setCodeStructure] = useState<Record<string, CodeStructure>>({})
  const [stats, setStats] = useState<Stats | null>(null)
  const [contextFiles, setContextFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', message: string}[]>([]);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Dark mode color scheme
  const cardBg = 'gray.800'
  const borderColor = 'gray.700'
  const textColor = 'gray.100'
  const mutedTextColor = 'gray.400'
  const accentColor = 'blue.300'
  const successColor = 'green.300'
  const warningColor = 'orange.300'
  const errorColor = 'red.300'
  const codeBg = 'gray.700'
  const headerBg = 'gray.800'
  const headerBorder = 'gray.700'
  const headerShadow = 'lg'

  const validateGitHubUrl = (url: string) => {
    if (!url) return false
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === 'github.com'
    } catch {
      return false
    }
  }

  const analyzeRepo = async (urlOverride?: string) => {
    const urlToAnalyze = urlOverride ?? repoUrl;
    if (!urlToAnalyze) {
      toast({
        title: 'Error',
        description: 'Please enter a GitHub repository URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!validateGitHubUrl(urlToAnalyze)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)
    try {
      const response = await axios.post<AnalyzeResponse>(`${API_URL}/analyze`, { url: urlToAnalyze })
      setSummary(response.data.summary)
      setReadme(response.data.readme)
      setCodeStructure(response.data.code_structure)
      setStats(response.data.stats)
      setChatHistory([]);
      setQuestion('');
      setAnswer('');
      setContextFiles([])
      setActiveTab(0)
      toast({
        title: 'Success!',
        description: 'Repository analyzed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      let errorMessage = 'Failed to analyze repository'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.detail || errorMessage
      }
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    setIsAnalyzing(false)
  }

  const handleSendQuestion = async () => {
    if (!question.trim()) return;
    setChatHistory((prev) => [...prev, { role: 'user', message: question }]);
    setQuestion('');
    setIsAsking(true);
    try {
      const response = await axios.post<QuestionResponse>(`${API_URL}/ask`, {
        question,
        repo_url: repoUrl,
      });
      setChatHistory((prev) => [...prev, { role: 'ai', message: response.data.answer }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: 'ai', message: 'Failed to get answer.' }]);
    }
    setIsAsking(false);
  };

  // Example repositories
  const exampleRepos = [
    {
      name: 'React',
      description: 'The library for web and native user interfaces',
      url: 'https://github.com/facebook/react',
      stars: '210k+',
      language: 'JavaScript'
    },
    {
      name: 'Vue.js',
      description: 'The Progressive JavaScript Framework',
      url: 'https://github.com/vuejs/vue',
      stars: '205k+',
      language: 'JavaScript'
    },
    {
      name: 'FastAPI',
      description: 'Modern, fast web framework for building APIs',
      url: 'https://github.com/tiangolo/fastapi',
      stars: '70k+',
      language: 'Python'
    }
  ]

  // Features array
  const features = [
    {
      title: 'Smart Analysis',
      description: 'AI-powered code analysis that understands your codebase structure and patterns.',
      icon: FiCpu,
      color: 'blue'
    },
    {
      title: 'Instant Q&A',
      description: 'Ask questions about any part of the code and get intelligent, context-aware answers.',
      icon: FiMessageSquare,
      color: 'green'
    },
    {
      title: 'Multi-Language',
      description: 'Support for Python, JavaScript, TypeScript, Java, Go, C++, and many more languages.',
      icon: FiCode,
      color: 'purple'
    },
    {
      title: 'Fast & Free',
      description: 'Lightning-fast analysis with intelligent caching. Completely free to use.',
      icon: FiZap,
      color: 'orange'
    }
  ]

  const handleExampleSelect = (url: string) => {
    setRepoUrl(url);
    onClose();
    toast({
      title: 'Example loaded!',
      description: 'Analyzing repository...'
      ,status: 'info',
      duration: 3000,
      isClosable: true,
    });
    setTimeout(() => analyzeRepo(url), 0); // Ensure state is updated before analyzing
  };

  const renderCodeStructure = () => {
    const files = Object.entries(codeStructure)
    
    return (
      <Accordion allowMultiple>
        {files.slice(0, 20).map(([filePath, structure]) => (
          <AccordionItem key={filePath} border="none" mb={2}>
            <AccordionButton
              bg="gray.700"
              _hover={{ bg: 'gray.600' }}
              borderRadius="lg"
              p={4}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Icon as={FiFile} color={accentColor} />
                  <Text fontWeight="medium" color={textColor}>{filePath}</Text>
                  {structure.functions && (
                    <Badge colorScheme="green" size="sm" variant="subtle">
                      {structure.functions.length} func
                    </Badge>
                  )}
                  {structure.classes && (
                    <Badge colorScheme="purple" size="sm" variant="subtle">
                      {structure.classes.length} class
                    </Badge>
                  )}
                </HStack>
              </Box>
              <AccordionIcon color={mutedTextColor} />
            </AccordionButton>
            <AccordionPanel pb={4} pt={2}>
              <VStack align="stretch" spacing={3}>
                {structure.functions && structure.functions.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>Functions:</Text>
                    <List spacing={1}>
                      {structure.functions.slice(0, 5).map((func, idx) => (
                        <ListItem key={idx}>
                          <HStack>
                            <ListIcon as={FiHash} color={successColor} />
                            <Code fontSize="sm" bg="gray.700" color={textColor}>
                              {func.name}({func.args.join(', ')})
                            </Code>
                            <Text fontSize="xs" color={mutedTextColor}>line {func.line}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {structure.classes && structure.classes.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>Classes:</Text>
                    <List spacing={1}>
                      {structure.classes.slice(0, 3).map((cls, idx) => (
                        <ListItem key={idx}>
                          <HStack>
                            <ListIcon as={FiTag} color={warningColor} />
                            <Code fontSize="sm" bg="gray.700" color={textColor}>
                              {cls.name}
                            </Code>
                            <Text fontSize="xs" color={mutedTextColor}>line {cls.line}</Text>
                            {cls.methods && cls.methods.length > 0 && (
                              <Badge size="sm" colorScheme="blue" variant="subtle">
                                {cls.methods.length} methods
                              </Badge>
                            )}
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  return (
    <Box minH="100vh" color={textColor} position="relative" overflow="hidden">
      {/* Floating Background Elements */}
      <Box
        position="fixed"
        top="10%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="blue.900"
        opacity={0.1}
        animation="float 6s ease-in-out infinite"
        zIndex={0}
        filter="blur(40px)"
      />
      <Box
        position="fixed"
        top="60%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="purple.900"
        opacity={0.1}
        animation="float 8s ease-in-out infinite reverse"
        zIndex={0}
        filter="blur(50px)"
      />
      <Box
        position="fixed"
        bottom="20%"
        left="20%"
        w="150px"
        h="150px"
        borderRadius="full"
        bg="green.900"
        opacity={0.1}
        animation="float 7s ease-in-out infinite"
        zIndex={0}
        filter="blur(30px)"
      />

      {/* Enhanced Header */}
      <Box 
        as="header" 
        py={6} 
        borderBottom="1px" 
        borderColor={headerBorder} 
        bg={headerBg}
        backdropFilter="blur(20px)"
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow={headerShadow}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <img src="/logo.jpeg" alt="Squirrel AI Logo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} />
              <VStack align="start" spacing={0}>
                <Heading size="lg" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                  Squirrel AI
                </Heading>
                <Text fontSize="xs" color={mutedTextColor}>AI-Powered Code Analysis</Text>
              </VStack>
            </HStack>
            <HStack spacing={4}>
              <Tag colorScheme="green" variant="subtle" size="sm">
                <TagLeftIcon as={FiZap} />
                <TagLabel>AI-Powered</TagLabel>
              </Tag>
              <Tag colorScheme="blue" variant="subtle" size="sm">
                <TagLeftIcon as={FiGlobe} />
                <TagLabel>OpenAI</TagLabel>
              </Tag>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        {/* Enhanced Hero Section */}
        <VStack spacing={12} textAlign="center" mb={16}>
          <VStack spacing={6} maxW="4xl">
            <VStack spacing={4}>
              <Badge 
                colorScheme="purple" 
                variant="subtle" 
                px={3} 
                py={1} 
                borderRadius="full"
                animation="float 3s ease-in-out infinite"
              >
                <HStack spacing={2}>
                  <Icon as={FiTrendingUp} />
                  <Text>Latest Version 2.0</Text>
                </HStack>
              </Badge>
              <Heading 
                size="2xl" 
                bgGradient="linear(to-r, blue.600, purple.600)" 
                bgClip="text"
                lineHeight="1.2"
                fontWeight="extrabold"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                Understand Any GitHub Repository
                <br />
                <Text as="span" fontSize="xl" color={mutedTextColor} fontWeight="normal">
                  in Seconds with AI
                </Text>
              </Heading>
            </VStack>
            <Text 
              fontSize="xl" 
              color={mutedTextColor} 
              maxW="2xl" 
              lineHeight="1.6"
              textShadow="0 1px 2px rgba(0,0,0,0.2)"
            >
              Squirrel AI uses advanced AI to analyze your codebase, answer questions, and provide insights 
              that help you understand complex repositories instantly.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="blue"
                leftIcon={<FiPlay />}
                onClick={() => document.getElementById('repo-input')?.focus()}
                borderRadius="full"
                px={8}
                bgGradient="linear(to-r, blue.500, blue.600)"
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                  bgGradient: 'linear(to-r, blue.600, blue.700)'
                }}
                _active={{
                  transform: 'translateY(0)',
                  bgGradient: 'linear(to-r, blue.700, blue.800)'
                }}
                transition="all 0.2s"
              >
                Try It Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                leftIcon={<FiBookOpen />}
                borderRadius="full"
                px={8}
                borderColor={accentColor}
                color={accentColor}
                _hover={{ 
                  transform: 'translateY(-2px)',
                  bg: "blue.900",
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
                transition="all 0.2s"
                onClick={onOpen}
              >
                View Examples
              </Button>
            </HStack>
          </VStack>

          {/* Demo Video Section */}
          <VStack spacing={8} mb={16}>
            <VStack spacing={4} textAlign="center">
              <Badge 
                colorScheme="green" 
                variant="subtle" 
                px={3} 
                py={1} 
                borderRadius="full"
              >
                <HStack spacing={2}>
                  <Icon as={FiPlay} />
                  <Text>See It In Action</Text>
                </HStack>
              </Badge>
              <Heading size="xl" bgGradient="linear(to-r, green.400, blue.400)" bgClip="text">
                Watch Squirrel AI Work
              </Heading>
              <Text fontSize="lg" color={mutedTextColor} maxW="2xl">
                See how Squirrel AI analyzes repositories and answers questions in real-time
              </Text>
            </VStack>
            <Card 
              bg={cardBg} 
              border="1px" 
              borderColor={borderColor} 
              borderRadius="2xl" 
              shadow="xl"
              overflow="hidden"
              backdropFilter="blur(20px)"
              maxW="4xl"
              w="full"
              _hover={{ 
                transform: 'translateY(-4px)', 
                shadow: '2xl',
                borderColor: 'green.400'
              }}
              transition="all 0.3s"
            >
              <CardBody p={0} position="relative">
                <video
                  ref={videoRef}
                  src="/demo.mp4"
                  controls
                  style={{ width: '100%', height: 'auto', borderRadius: '1rem', display: 'block', background: 'black' }}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                />
                {/* Video Overlay with Play Icon - Only show when not playing */}
                {!isVideoPlaying && (
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    pointerEvents="none"
                    opacity={0.85}
                    zIndex={1}
                  >
                    <Box
                      bg="rgba(0, 0, 0, 0.0)"
                      borderRadius="full"
                      p={4}
                    >
                      <Icon as={FiPlay} w={16} h={16} color="white" />
                    </Box>
                  </Box>
                )}
              </CardBody>
            </Card>
            {/* Call to Action */}
            <VStack spacing={4} pt={4}>
              <Text fontSize="lg" color={mutedTextColor} textAlign="center">
                Ready to analyze your own repositories?
              </Text>
              <Button
                size="lg"
                colorScheme="green"
                leftIcon={<FiGithub />}
                onClick={() => document.getElementById('repo-input')?.focus()}
                borderRadius="full"
                px={8}
                bgGradient="linear(to-r, green.500, green.600)"
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
                  bgGradient: 'linear(to-r, green.600, green.700)'
                }}
                _active={{
                  transform: 'translateY(0)',
                  bgGradient: 'linear(to-r, green.700, green.800)'
                }}
                transition="all 0.2s"
              >
                Play with Squirrel AI Now
              </Button>
            </VStack>
          </VStack>

          {/* Enhanced Stats */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8} w="full" maxW="3xl">
            <Stat textAlign="center">
              <StatNumber 
                color={accentColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(59, 130, 246, 0.4)"
              >
                10+
              </StatNumber>
              <StatLabel color={mutedTextColor}>Languages Supported</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={successColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(34, 197, 94, 0.4)"
              >
                Instant
              </StatNumber>
              <StatLabel color={mutedTextColor}>Analysis Speed</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={warningColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(251, 146, 60, 0.4)"
              >
                100%
              </StatNumber>
              <StatLabel color={mutedTextColor}>Free to Use</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={errorColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(239, 68, 68, 0.4)"
              >
                AI
              </StatNumber>
              <StatLabel color={mutedTextColor}>Powered</StatLabel>
            </Stat>
          </SimpleGrid>
        </VStack>

        {/* Enhanced Example Repositories */}
        <VStack spacing={6} mb={12}>
          <VStack spacing={2}>
            <Text fontSize="lg" color={mutedTextColor} fontWeight="medium">Try with popular repositories:</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              {exampleRepos.map((repo, index) => (
                <Card 
                  key={index} 
                  bg={cardBg} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="xl" 
                  shadow="md"
                  cursor="pointer"
                  backdropFilter="blur(15px)"
                  _hover={{ 
                    transform: 'translateY(-4px)', 
                    shadow: 'xl',
                    borderColor: accentColor,
                    bg: 'gray.700'
                  }}
                  transition="all 0.3s"
                  onClick={() => handleExampleSelect(repo.url)}
                >
                  <CardBody p={6}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiStar} color={warningColor} />
                          <Text fontWeight="bold" color={textColor}>{repo.name}</Text>
                        </HStack>
                        <Badge colorScheme="blue" variant="subtle" size="sm">
                          {repo.language}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={mutedTextColor} noOfLines={2} lineHeight="1.5">
                        {repo.description}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={mutedTextColor}>
                          ⭐ {repo.stars}
                        </Text>
                        <Icon as={FiExternalLink} color={mutedTextColor} />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </VStack>

        {/* Enhanced Main Interface */}
        <VStack spacing={8} align="stretch">
          {/* Enhanced Input Section */}
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor} 
            borderRadius="2xl" 
            shadow="xl"
            overflow="hidden"
            backdropFilter="blur(20px)"
            _hover={{ 
              transform: 'translateY(-2px)', 
              shadow: '2xl',
              borderColor: accentColor,
              backdropFilter: 'blur(30px)'
            }}
            transition="all 0.3s"
          >
            <CardBody p={8}>
              <VStack spacing={6}>
                <HStack spacing={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}20`} 
                    borderRadius="full"
                    color={accentColor}
                  >
                    <Icon as={FiGithub} w={5} h={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color={textColor}>Repository Analysis</Heading>
                    <Text fontSize="sm" color={mutedTextColor}>Enter a GitHub URL to get started</Text>
                  </VStack>
                </HStack>
                <VStack spacing={4} w="full">
                  <Box position="relative" w="full">
                    <Input
                      id="repo-input"
                      size="lg"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      borderColor={borderColor}
                      borderRadius="xl"
                      bg="gray.700"
                      _hover={{
                        bg: 'gray.600',
                        borderColor: accentColor
                      }}
                      _focus={{ 
                        borderColor: accentColor, 
                        boxShadow: `0 0 0 1px ${accentColor}`,
                        transform: 'scale(1.01)',
                        bg: 'gray.600'
                      }}
                      transition="all 0.2s"
                      pr={12}
                    />
                    {repoUrl && (
                      <IconButton
                        aria-label="Clear input"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        position="absolute"
                        right={2}
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={() => setRepoUrl('')}
                        color={mutedTextColor}
                        _hover={{ color: errorColor }}
                      />
                    )}
                  </Box>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    onClick={() => analyzeRepo()}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing Repository..."
                    leftIcon={<FiSearch />}
                    w="full"
                    h={14}
                    borderRadius="xl"
                    bgGradient="linear(to-r, blue.500, blue.600)"
                    _hover={{ 
                      transform: 'translateY(-2px)', 
                      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                      bgGradient: 'linear(to-r, blue.600, blue.700)'
                    }}
                    _active={{
                      transform: 'translateY(0)',
                      bgGradient: 'linear(to-r, blue.700, blue.800)'
                    }}
                    transition="all 0.2s"
                    isDisabled={!repoUrl.trim()}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}
                  </Button>
                </VStack>
                {isAnalyzing && (
                  <VStack spacing={3} w="full">
                    <Progress 
                      size="sm" 
                      isIndeterminate 
                      colorScheme="blue" 
                      w="full" 
                      borderRadius="full"
                      bg="blue.900"
                    />
                    <HStack spacing={2} color={mutedTextColor}>
                      <Spinner size="sm" color={accentColor} />
                      <Text fontSize="sm">
                        Analyzing code structure and generating insights...
                      </Text>
                    </HStack>
                  </VStack>
                )}
                {error && (
                  <Alert status="error" borderRadius="xl" variant="subtle">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Analysis Failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Enhanced Results Section with Tabs */}
          {(summary || readme || Object.keys(codeStructure).length > 0) && (
            <Card 
              bg={cardBg} 
              border="1px" 
              borderColor={borderColor} 
              borderRadius="2xl" 
              shadow="xl"
              overflow="hidden"
              backdropFilter="blur(20px)"
              _hover={{ 
                transform: 'translateY(-2px)', 
                shadow: '2xl',
                borderColor: accentColor,
                backdropFilter: 'blur(30px)'
              }}
              transition="all 0.3s"
            >
              <CardBody p={0}>
                <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
                  <TabList bg="gray.700" px={6} pt={6}>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiCheckCircle} />
                        <Text>Summary</Text>
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiBookOpen} />
                        <Text>README</Text>
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiCode} />
                        <Text>Code Structure</Text>
                        {stats && (
                          <Badge colorScheme="blue" size="sm" variant="subtle">
                            {stats.total_files}
                          </Badge>
                        )}
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg"
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiMessageSquare} />
                        <Text>Q&A</Text>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Enhanced Summary Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiCheckCircle} w={5} h={5} color={successColor} />
                          <Heading size="md" color={textColor}>Repository Summary</Heading>
                        </HStack>
                        
                        {stats && (
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                            <Stat>
                              <StatNumber color={accentColor} fontSize="2xl">{stats.total_files}</StatNumber>
                              <StatLabel color={mutedTextColor}>Total Files</StatLabel>
                            </Stat>
                            {stats.languages && Object.entries(stats.languages).map(([lang, count]) => (
                              <Stat key={lang}>
                                <StatNumber color={successColor} fontSize="2xl">{count}</StatNumber>
                                <StatLabel color={mutedTextColor}>{lang} Files</StatLabel>
                              </Stat>
                            ))}
                            <Stat>
                              <StatNumber color={errorColor} fontSize="2xl">{stats.total_functions}</StatNumber>
                              <StatLabel color={mutedTextColor}>Functions</StatLabel>
                            </Stat>
                          </SimpleGrid>
                        )}
                        
                        <Box 
                          p={6} 
                          bg="rgba(44, 48, 66, 0.98)" 
                          borderRadius="xl"
                          border="1.5px solid"
                          borderColor="rgba(255,255,255,0.15)"
                          color="whiteAlpha.900"
                          boxShadow="0 4px 24px rgba(0,0,0,0.25)"
                        >
                          <ReactMarkdown>{summary}</ReactMarkdown>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced README Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiBookOpen} w={5} h={5} color={warningColor} />
                          <Heading size="md" color={textColor}>README Content</Heading>
                        </HStack>
                        <Box
                          p={6}
                          bg="rgba(44, 48, 66, 0.98)"
                          borderRadius="xl"
                          border="1.5px solid"
                          borderColor="rgba(255,255,255,0.15)"
                          color="whiteAlpha.900"
                          boxShadow="0 4px 24px rgba(0,0,0,0.25)"
                          maxH="600px"
                          overflowY="auto"
                        >
                          <ReactMarkdown>{readme}</ReactMarkdown>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Code Structure Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiCode} w={5} h={5} color={accentColor} />
                          <Heading size="md" color={textColor}>Code Structure</Heading>
                        </HStack>
                        <Box
                          p={6}
                          bg="gray.700"
                          borderRadius="xl"
                          maxH="600px"
                          overflowY="auto"
                          border="1px"
                          borderColor={borderColor}
                        >
                          {renderCodeStructure()}
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Q&A Tab as Chat */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch" h="500px">
                        <Box bg="rgba(44, 48, 66, 0.98)" borderRadius="xl" p={4} flex="1" overflowY="auto" ref={chatBoxRef}>
                          {chatHistory.length === 0 && (
                            <Text color={mutedTextColor} textAlign="center" mt={8}>Ask a question about the codebase to start the chat!</Text>
                          )}
                          {chatHistory.map((msg, idx) => (
                            <HStack key={idx} width="100%" mb={2}>
                              {msg.role === 'user' ? (
                                <Box
                                  bg="blue.600"
                                  color="whiteAlpha.900"
                                  px={4}
                                  py={2}
                                  borderRadius="lg"
                                  maxWidth="70%"
                                  boxShadow="md"
                                  ml="auto"
                                >
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    code(props) {
                                      const { className, children, ...rest } = props;
                                      const isBlock = className && className.startsWith('language-');
                                      if (isBlock) {
                                        return (
                                          <pre style={{background: '#232946', color: '#fff', borderRadius: '8px', padding: '12px', margin: '8px 0', overflowX: 'auto'}}>
                                            <code className={className} {...rest}>{children}</code>
                                          </pre>
                                        );
                                      }
                                      return (
                                        <code style={{background: '#232946', color: '#fff', borderRadius: '4px', padding: '2px 6px'}} {...rest}>{children}</code>
                                      );
                                    }
                                  }}>
                                    {msg.message}
                                  </ReactMarkdown>
                                </Box>
                              ) : (
                                <Box
                                  maxWidth="70%"
                                  color="whiteAlpha.900"
                                  fontSize="md"
                                  lineHeight="1.7"
                                  mr="auto"
                                >
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    code(props) {
                                      const { className, children, ...rest } = props;
                                      const isBlock = className && className.startsWith('language-');
                                      if (isBlock) {
                                        return (
                                          <pre style={{background: '#232946', color: '#fff', borderRadius: '8px', padding: '12px', margin: '8px 0', overflowX: 'auto'}}>
                                            <code className={className} {...rest}>{children}</code>
                                          </pre>
                                        );
                                      }
                                      return (
                                        <code style={{background: '#232946', color: '#fff', borderRadius: '4px', padding: '2px 6px'}} {...rest}>{children}</code>
                                      );
                                    }
                                  }}>
                                    {msg.message}
                                  </ReactMarkdown>
                                </Box>
                              )}
                            </HStack>
                          ))}
                        </Box>
                        <HStack spacing={2} align="flex-end">
                          <Textarea
                            size="lg"
                            placeholder="Ask a question about the repository..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={2}
                            borderColor={borderColor}
                            borderRadius="xl"
                            bg="gray.700"
                            color={textColor}
                            _hover={{ bg: 'gray.600', borderColor: successColor }}
                            _focus={{ borderColor: successColor, boxShadow: `0 0 0 1px ${successColor}`, bg: 'gray.600' }}
                            transition="all 0.2s"
                            pr={12}
                            isDisabled={isAsking}
                          />
                          <Button
                            size="lg"
                            colorScheme="green"
                            onClick={handleSendQuestion}
                            isLoading={isAsking}
                            loadingText="Generating Answer..."
                            leftIcon={<FiMessageSquare />}
                            borderRadius="xl"
                            px={6}
                            h={14}
                            bgGradient="linear(to-r, green.500, green.600)"
                            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)', bgGradient: 'linear(to-r, green.600, green.700)' }}
                            _active={{ transform: 'translateY(0)', bgGradient: 'linear(to-r, green.700, green.800)' }}
                            transition="all 0.2s"
                            isDisabled={!question.trim() || isAsking}
                          >
                            {isAsking ? 'Thinking...' : 'Send'}
                          </Button>
                        </HStack>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Enhanced Features Section */}
        <Box mt={20}>
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
                Why Choose Squirrel AI?
              </Badge>
              <Heading size="xl" bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
                Powerful AI Features
              </Heading>
              <Text fontSize="lg" color={mutedTextColor} maxW="2xl">
                Designed to make code exploration effortless and insightful.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  bg={cardBg} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="2xl" 
                  shadow="lg" 
                  p={6}
                  backdropFilter="blur(15px)"
                  _hover={{ 
                    transform: 'translateY(-8px)', 
                    shadow: '2xl',
                    borderColor: `${feature.color}.300`,
                    bg: 'gray.700',
                    backdropFilter: 'blur(25px)'
                  }}
                  transition="all 0.3s"
                >
                  <VStack spacing={4} textAlign="center">
                    <Box 
                      p={4} 
                      bg={`${feature.color}.900`}
                      borderRadius="full"
                      color={`${feature.color}.300`}
                      _groupHover={{
                        transform: 'scale(1.1)',
                        bg: `${feature.color}.800`
                      }}
                      transition="all 0.2s"
                    >
                      <Icon as={feature.icon} w={8} h={8} />
                    </Box>
                    <Heading size="md" color={textColor}>{feature.title}</Heading>
                    <Text fontSize="sm" color={mutedTextColor} lineHeight="1.6">{feature.description}</Text>
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      </Container>

      {/* Enhanced Footer */}
      <Box 
        as="footer" 
        py={12} 
        mt={20} 
        borderTop="1px" 
        borderColor={borderColor} 
        bg="gray.800"
        backdropFilter="blur(10px)"
      >
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4} w="full">
              <HStack spacing={3}>
                <img src="/logo.jpeg" alt="Squirrel AI Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)' }} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" color={textColor}>Squirrel AI</Text>
                  <Text fontSize="xs" color={mutedTextColor}>AI-Powered Code Analysis</Text>
                </VStack>
              </HStack>
              <HStack spacing={6}>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiShield} />
                    <Text>Privacy</Text>
                  </HStack>
                </Link>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiFile} />
                    <Text>Terms</Text>
                  </HStack>
                </Link>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiMessageSquare} />
                    <Text>Support</Text>
                  </HStack>
                </Link>
              </HStack>
            </Flex>
            <Divider borderColor={borderColor} />
            <Text fontSize="sm" color={mutedTextColor} textAlign="center">
              Powered by OpenAI & Advanced AI • Made with ❤️ for developers
            </Text>
          </VStack>
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent bg={cardBg} color={textColor}>
          <ModalHeader>Select an Example Repository</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {exampleRepos.map((repo, idx) => (
                <Card
                  key={idx}
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  shadow="md"
                  cursor="pointer"
                  _hover={{
                    transform: 'translateY(-4px)',
                    shadow: 'xl',
                    borderColor: accentColor,
                    bg: 'gray.700',
                  }}
                  transition="all 0.3s"
                  onClick={() => handleExampleSelect(repo.url)}
                >
                  <CardBody p={6}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiStar} color={warningColor} />
                          <Text fontWeight="bold" color={textColor}>{repo.name}</Text>
                        </HStack>
                        <Badge colorScheme="blue" variant="subtle" size="sm">
                          {repo.language}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={mutedTextColor} noOfLines={2} lineHeight="1.5">
                        {repo.description}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={mutedTextColor}>
                          ⭐ {repo.stars}
                        </Text>
                        <Icon as={FiExternalLink} color={mutedTextColor} />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default App
