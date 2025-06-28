document.addEventListener('DOMContentLoaded', function() {
  const postsGrid = document.getElementById('postsGrid');

  const dummyPosts = [
    {
      title: 'Comprehensive Test Cases',
      content: 'Design test cases that cover not only happy paths but also edge cases, negative scenarios, and boundary conditions for robust testing.',
      image: '/img/cat/5d82da80-01a8-4a8b-b9d4-87109cd14f95.png'
    },
    {
      title: 'Automate Repetitive Tests',
      content: 'Automate regression tests and other repetitive checks to speed up feedback cycles and free up manual testers for exploratory testing.',
      image: '/img/cat/angry.png'
    },
    {
      title: 'User Experience Testing',
      content: 'Beyond functionality, focus on user experience (UX) testing to ensure the application is intuitive, accessible, and enjoyable to use.',
      image: '/img/cat/arrogant.png'
    },
    {
      title: 'Performance Testing',
      content: 'Don\'t overlook performance. Conduct load, stress, and scalability tests to ensure the application handles expected (and unexpected) user volumes.',
      image: '/img/cat/back.png'
    },
    {
      title: 'Security Testing Basics',
      content: 'Incorporate basic security testing, such as input validation and authentication checks, to identify common vulnerabilities early.',
      image: '/img/cat/bday.png'
    },
    {
      title: 'Clear Bug Reporting',
      content: 'Write clear, concise, and reproducible bug reports. Include steps to reproduce, expected vs. actual results, and environmental details.',
      image: '/img/cat/box.png'
    },
    {
      title: 'Continuous Integration',
      content: 'Integrate testing into your CI/CD pipeline. Run automated tests with every code commit to catch issues immediately.',
      image: '/img/cat/eat.png'
    },
    {
      title: 'Collaboration with Developers',
      content: 'Foster strong collaboration between QA and development teams. Early and frequent communication prevents misunderstandings and speeds up fixes.',
      image: '/img/cat/fish.png'
    },
    {
      title: 'Exploratory Testing',
      content: 'Encourage exploratory testing to uncover unexpected bugs and usability issues that might be missed by scripted tests.',
      image: '/img/cat/jump.png'
    },
    {
      title: 'Exploratory Testing',
      content: 'Encourage exploratory testing to uncover unexpected bugs and usability issues that might be missed by scripted tests.',
      image: '/img/cat/lick.png'
    }
  ];

  function renderPosts() {
    postsGrid.innerHTML = ''; // Clear existing posts
    dummyPosts.forEach(post => {
      const postCard = `
        <div class="col">
          <div class="card h-100">
            <img src="${post.image}" class="card-img-top" alt="${post.title}">
            <div class="card-body">
              <h5 class="card-title">${post.title}</h5>
              <p class="card-text">${post.content}</p>
            </div>
            <div class="card-footer">
              <small class="text-muted">Dummy Post</small>
            </div>
          </div>
        </div>
      `;
      postsGrid.innerHTML += postCard;
    });
  }

  renderPosts();
});