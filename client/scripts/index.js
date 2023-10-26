document.addEventListener("DOMContentLoaded", () => {
  const feed = document.getElementById("feed");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const resultText = document.getElementById("result");
  const logoutButton = document.getElementById("logout");

  const decryptPostContent = (encryptedContent) => {
      const decrypt = new JSEncrypt();
      decrypt.setPrivateKey(localStorage.getItem('privateKey'));
      return decrypt.decrypt(encryptedContent);
  };

  const getPosts = async () => {
      if (!sessionStorage.getItem("token")) {
          logoutButton.classList.add("hidden");
          return;
      }
      feed.innerHTML = "";
      const response = await fetch("/api/posts", {
          headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
      });
      const posts = await response.json();
      for (const post of posts) {
          const decryptedContent = decryptPostContent(post.content);
          const postElement = document.createElement("div");
          postElement.innerHTML = `
              <h3>${post.title}</h3>
              <p>${decryptedContent}</p>
          `;
          feed.appendChild(postElement);
      }
  };

  const getKeyPair = async () => {
      const response = await fetch('/generate-keys');
      const keys = await response.json();
      localStorage.setItem('publicKey', keys.publicKey);
      localStorage.setItem('privateKey', keys.privateKey);
  };

  const login = async (username, password) => {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(username)) {
          resultText.innerHTML = "Invalid E-Mail";
          return;
      }
      if (!password || password.length < 10) {
          resultText.innerHTML = "Password must be at least 10 characters.";
          return;
      }
      const response = await fetch("/api/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
      });
      const result = await response.text();
      if (result) {
          sessionStorage.setItem("token", result);
          await getKeyPair();
          logoutButton.classList.remove("hidden");
          getPosts();
      } else {
          // You may want to handle failed login attempts here, for clarity.
          resultText.innerHTML = "Login failed.";
      }
  };

  loginButton.addEventListener("click", async () => {
      const username = usernameInput.value;
      const password = passwordInput.value;
      await login(username, password);
  });

  bruteForceButton.addEventListener("click", async () => {
      const username = usernameInput.value;
      const password = passwordInput.value;

      // WARNING: This can easily freeze the browser.
      while (true) {
          await login(username, password);
      }
  });

  logoutButton.addEventListener("click", () => {
      sessionStorage.removeItem("token");
      location.reload();
  });

  getPosts();
});

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;

    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${YOUR_SECRET_TOKEN}` // Dies sollte dynamisch aus dem Login-Token geholt werden
        },
        body: JSON.stringify({ title, content })
    });

    if (response.ok) {
        // Hier könnte eine Logik zur Aktualisierung des Feeds oder zur Anzeige einer Erfolgsmeldung stehen.
    } else {
        // Fehlerbehandlung
    }
});
const postButton = document.getElementById('postSubmit'); // Sie müssen einen Button oder ein anderes Element mit der ID 'postSubmit' in Ihrem HTML haben

postButton.addEventListener('click', () => {
    const content = document.getElementById('postContent').value;  // Annahme, dass es ein Input-Feld mit der ID 'postContent' gibt

    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(localStorage.getItem("publicKey"));
    const encryptedContent = encryptor.encrypt(content);

    // Dann senden Sie encryptedContent an den Server...
});

// Annahme, dass es eine Funktion gibt, die Posts vom Server abruft
async function fetchPostsFromServer() {
    const response = await fetch('/api/posts');  // oder Ihre entsprechende API-Route
    const posts = await response.json();

    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(localStorage.getItem("privateKey"));

    const decryptedPosts = posts.map(post => {
        const decryptedContent = decryptor.decrypt(post.content);
        return { ...post, content: decryptedContent };
    });

    // Zeigen Sie dann decryptedPosts in Ihrem Frontend an...
}
document.getElementById("postForm").addEventListener("submit", function(event) {
    event.preventDefault();
    // Ihr Verschlüsselungscode und das Senden des verschlüsselten Inhalts an den Server hier...
});
