// Icons provided by https://devicon.dev/
const tools = [
  { icon: 'linux', tag: 'linux', hint: 'Linux' },
  { icon: 'raspberrypi', tag: 'raspberrypi', hint: 'Raspberry Pi' },
  { icon: 'ubuntu', tag: 'ubuntu', hint: 'Ubuntu' },
  { icon: 'debian', tag: 'debian', hint: 'Debian' },
  { icon: 'docker', tag: 'docker', hint: 'Docker' },
  { icon: 'portainer', tag: 'portainer', hint: 'Portainer', isClickable: false },
  { icon: 'kubernetes', tag: 'kubernetes', hint: 'Kubernetes', isClickable: false },
  { icon: 'cloudflare', tag: 'cloudflare', hint: 'Cloudflare' },
  { icon: 'windows11', tag: 'windows11', hint: 'Windows11', isClickable: false },
  { icon: 'bash', tag: 'bash', hint: 'Bash', isClickable: false },
  { icon: 'yaml', tag: 'yaml', hint: 'YAML', isClickable: false },
  { icon: 'vim', tag: 'vim', hint: 'Vim', isClickable: false },
  { icon: 'ssh', tag: 'ssh', hint: 'SSH', iconType: 'original-wordmark' },
  { icon: 'ansible', tag: 'ansible', hint: 'Ansible', isClickable: false },
  { icon: 'python', tag: 'python', hint: 'Python' },
  { icon: 'anaconda', tag: 'anaconda', hint: 'Anaconda' },
  { icon: 'jupyter', tag: 'jupyter', hint: 'Jupyter', isClickable: false },
  { icon: 'matplotlib', tag: 'matplotlib', hint: 'Matplotlib' },
  { icon: 'numpy', tag: 'numpy', hint: 'Numpy' },
  { icon: 'pandas', tag: 'pandas', hint: 'Pandas' },
  { icon: 'tensorflow', tag: 'tensorflow', hint: 'Tensorflow', isClickable: false },
  { icon: 'html5', tag: 'html', hint: 'HTML', isClickable: false },
  { icon: 'css3', tag: 'css', hint: 'CSS', isClickable: false },
  { icon: 'javascript', tag: 'javascript', hint: 'Javascript', isClickable: false },
  { icon: 'flask', tag: 'flask', hint: 'Flask', isClickable: false },
  { icon: 'react', tag: 'react', hint: 'React', isClickable: false },
  { icon: 'git', tag: 'git', hint: 'Git' },
  { icon: 'github', tag: 'github', hint: 'Github' },
  { icon: 'ruby', tag: 'ruby', hint: 'Ruby' },
  { icon: 'jekyll', tag: 'jekyll', hint: 'Jekyll' },
  { icon: 'markdown', tag: 'markdown', hint: 'Markdown' },
  { icon: 'vscode', tag: 'vscode', hint: 'Visual Studio Code', isClickable: false },
  { icon: 'azure', tag: 'azure', hint: 'Azure', isClickable: false },
  { icon: 'googlecloud', tag: 'googlecloud', hint: 'Google Cloud', isClickable: false },







    // Languages and frameworks
    // { icon: 'csharp', hint: 'C#' },
    // { icon: 'dot-net', tag: 'dotnet', hint: 'DotNet' },
    // { icon: 'dotnetcore', tag: 'dotnet-core', hint: 'DotNet Core' },
    // { icon: 'blazor', iconType: 'original', isClickable: false },
    // { icon: 'javascript' },
    // { icon: 'typescript' },
    // { icon: 'java' },
    // { icon: 'cplusplus', tag: 'c', hint: 'C++' },
    // { icon: 'python' },
    // { icon: 'php' },
    // { icon: 'delphi' },
    // { icon: 'pascal' },
    // { icon: 'basic' },
    // { icon: 'nodejs', hint: 'Node.js' },
    // { icon: 'react' },
    // { icon: 'electron', iconType: 'original' },
    // { icon: 'angular' },
    // { icon: 'android', isClickable: false },
    // { icon: 'html5', tag: 'html', hint: 'HTML' },
    // { icon: 'css3', tag: 'css', hint: 'CSS' },
    // { icon: 'sass', isClickable: false },
    // { icon: 'bootstrap' },
    // { icon: 'fastify' },
    // { icon: 'arduino' },
  
    // Host, deployment and CI/CD
    // { icon: 'docker' },
    // { icon: 'podman', isClickable: false },
    // { icon: 'kubernetes', isClickable: false },
    // { icon: 'helm', isClickable: false },
    // { icon: 'azure', isClickable: false },
    // { icon: 'google', hint: 'google', isClickable: false },
    // { icon: 'googlecloud', hint: 'googlecloud', isClickable: false },
    // { icon: 'tomcat', iconType: 'line' },
    // { icon: 'apache' },
    // { icon: 'github', hint: 'GitHub', isClickable: false },
    // { icon: 'azuredevops', hint: 'Azure DevOps', isClickable: false },
    
    // { icon: 'bitbucket', isClickable: false },
    // { icon: 'gitlab', hint: 'GitLab', isClickable: false },
    // { icon: 'jira', isClickable: false },
    // { icon: 'confluence', isClickable: false },
    // { icon: 'teamcity', hint: 'TeamCity', isClickable: false },
    // { icon: 'jenkins' },
  
    // IDEs, editors, and tools
    // { icon: 'vscode', hint: 'Visual Studio Code' },
    // { icon: 'rider' },
    // { icon: 'visualstudio', tag: 'visual-studio', hint: 'Visual Studio' },
    // { icon: 'netbeans', hint: 'NetBeans' },
    // { icon: 'eclipse', isClickable: false },
    // { icon: 'git', isClickable: false },
    // { icon: 'subversion', isClickable: false },
    // { icon: 'tfs', isClickable: false },
    // { icon: 'nuget', iconType: 'original', isClickable: false },
    // { icon: 'npm', iconType: 'original-wordmark', isClickable: false },
    // { icon: 'webpack' },
    // { icon: 'jekyll', tag: 'jekyll', hint: 'Jekyll' },
    // { icon: 'markdown', isClickable: false },
    // { icon: 'materialui', tag: 'material-ui', hint: 'Material UI' },
    // { icon: 'redux' },
    // { icon: 'vite' },
    // { icon: 'virtualbox' },
  
    // Databases
    // { icon: 'sqlite', hint: 'SQLite' },
    // { icon: 'mysql', hint: 'MySQL' },
    // { icon: 'microsoftsqlserver', hint: 'SQL Server', isClickable: false },
    // { icon: 'postgresql', hint: 'PostgreSQL', isClickable: false },
  
    // Testing tools
    // { icon: 'playwright' },
    // { icon: 'selenium' },
    // { icon: 'cucumber', isClickable: false },
    // { icon: 'postman', isClickable: false },
    // { icon: 'jmeter', isClickable: false },
  
    // Others
    // { icon: 'windows11', tag: 'windows', hint: 'Windows' },
    // { icon: 'powershell', isClickable: false },
    // { icon: 'linux' },
    // { icon: 'bash' },
    // { icon: 'vim', isClickable: false },
    // { icon: 'raspberrypi', hint: 'Raspberry Pi' },
    // { icon: 'chrome' },
    // { icon: 'firefox' },
    // { icon: 'opentelemetry', hint: 'OpenTelemetry', isClickable: false },
    // { icon: 'json', hint: 'JSON', isClickable: false },
    // { icon: 'yaml', hint: 'YAML', isClickable: false },
    // { icon: 'figma', isClickable: false },
    // { icon: 'msdos', hint: 'MS-DOS', isClickable: false },
  ];
  
  const container = document.getElementById('tools');
  
  tools.forEach((tool) => {
    const icon = tool.icon;
    const iconType = tool.iconType ?? 'plain';
    const tag = tool.tag ?? icon;
    const title = tool.hint ?? tool.icon;
    const isClickable = tool.isClickable ?? true;
  
    const anchor = document.createElement('a');
    const classes = isClickable ? ['tool'] : ['tool', 'disabled'];
    anchor.classList.add(...classes);
    if (isClickable) {
      anchor.href = `/tags/${tag}`;
    }
    anchor.title = title.charAt(0).toUpperCase() + title.slice(1);
  
    const content = document.createElement('i');
    content.className = `tool-icon devicon-${icon}-${iconType}`;
  
    anchor.appendChild(content);
    container.appendChild(anchor);
  });
  
  document.querySelectorAll('.tool-icon').forEach((ti) => {
    ['mouseenter', 'touchstart'].forEach((event) =>
      ti.addEventListener(
        event,
        () => {
          ti.classList.add('colored');
          ti.parentElement.classList.add('hovered');
        },
        { passive: true }
      )
    );
    ['mouseleave', 'touchend', 'touchcancel'].forEach((event) =>
      ti.addEventListener(
        event,
        () => {
          ti.classList.remove('colored');
          ti.parentElement.classList.remove('hovered');
        },
        { passive: true }
      )
    );
  });