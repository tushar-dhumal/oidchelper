
````markdown
# OIDC Token Helper

This application provides a simple UI to acquire **Access Tokens** and **Refresh Tokens** using the **OIDC Authorization Code Flow with PKCE**. It supports any standards-compliant OIDC provider and is intended for use by customers and internal teams during installation or while using REST clients.

---

## 🔧 Features

- Supports **OIDC Authorization Code Flow with PKCE**
- Works with **any OIDC-compliant provider**
- Provides **Access Token**, **Refresh Token**, **ID Token**, and **Expiry info**
- Lightweight and runs in a Docker container

---

## 🚀 Getting Started

### 1. Build and Package the App as a Docker Image

First, build a `.tar` image using the provided Dockerfile:

```bash
# Build the image
docker build -t oidc-token-helper .

# Save it to a tar file (for offline use or distribution)
docker save oidc-token-helper > oidc-token-helper.tar
````

### 2. Load and Run the Docker Image

To load and run the image on any machine:

```bash
# Load the image
docker load < oidc-token-helper.tar

# Run the container
docker run -p 9080:9080 oidc-token-helper
```

The app will be available at:
**[http://localhost:9080/oidchelper/](http://localhost:9080/oidchelper/)**

---

## 🧾 How to Use the App

Once the app is running in your browser, follow these steps:

1. **Enter the following fields in the form:**

   * **Client ID**: From your OIDC provider
   * **Client Secret** (if required)
   * **Discovery URL**: Usually ends in `/.well-known/openid-configuration`
   * **Scopes**: e.g., `openid profile email offline_access`

2. **Submit the form**
   The app will:

   * Initiate the PKCE flow
   * Redirect you to your identity provider’s login page
   * After login, complete the token exchange

3. **View Token Details**
   After successful authentication, the app will display:

   * Access Token
   * Refresh Token (if provided)
   * ID Token
   * Expiration Time

---

## 📦 Base Image & Runtime

This app runs on the lightweight [WebSphere Liberty](https://www.ibm.com/cloud/websphere-liberty) base image with Java 21 OpenJ9:

```Dockerfile
FROM icr.io/appcafe/websphere-liberty:25.0.0.6-kernel-java21-openj9-ubi-minimal
RUN /opt/ibm/wlp/bin/installUtility install servlet-6.0 webCache-1.0 transportSecurity-1.0
COPY static-web/ /config/apps/oidchelper/
COPY server.xml /config/
EXPOSE 9080
CMD ["/opt/ibm/wlp/bin/server", "run", "defaultServer"]
```

---

## 🛡️ Security Note

* PKCE flow is secure even for public clients
* Do not share your client secrets publicly
* For production, always use HTTPS endpoints

---

## 📄 License

MIT

