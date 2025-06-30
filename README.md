# DEMO ACME Fruits - Backend

## Description

This demo, implemented with [NestJS](https://nestjs.com/), is a backend that supports the issuance and verification flows of **verifiable credentials** using the **OpenID4VCI** and **SIOPv2** standards. The goal is to demonstrate how an issuing entity (such as a fictional university called **Melon University**) can issue diplomas as verifiable credentials and how another verifying entity (such as a fictional corporation called **Mango Corp**) can validate these credentials.

### Open Source Dependencies

This demo is based on the implementation of several open-source libraries that are part of the **KayDev** project. These libraries are fundamental for managing the issuance and verification flows of verifiable credentials:

1. **[@kaytrust/did-near](https://github.com/kaytrust/did-near)**  
   Implements support for the decentralized identity (DID) method on the NEAR blockchain.

2. **[@kaytrust/did-ethr](https://github.com/kaytrust/did-ethr)**  
   Provides support for the DID method on the Ethereum blockchain.

3. **[@kaytrust/did-near-resolver](https://github.com/DTI-web3/did-near-resolver)**  
   Allows resolving DID documents on the NEAR blockchain.

4. **[@kaytrust/openid4vci](https://github.com/kaytrust/openid4vci)**  
   Implements the OpenID4VCI standard for issuing verifiable credentials.

5. **[@kaytrust/prooftypes](https://github.com/KayTrust/prooftypes)**  
   Provides types and validations for cryptographic proofs in verifiable credentials.

These libraries are essential for implementing the flows in this demo, as they enable the management of decentralized identities and verifiable credentials in a standardized and secure manner.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation and Configuration](#installation-and-configuration)
3. [Running the Project](#running-the-project)
4. [Project Structure](#project-structure)
5. [Main Modules](#main-modules)
6. [Environment Variables](#environment-variables)
7. [Implemented Flows](#implemented-flows)
8. [Testing](#testing)
9. [Additional Resources](#additional-resources)

---

## Prerequisites

Before starting, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [Yarn](https://yarnpkg.com/) as the package manager

---

## Installation and Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/kaytrust/demo-acme-frutas-back.git
cd demo-acme-frutas-back
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the project's root directory and define the necessary environment variables. You can use the `.env.example` file as a reference:

```bash
cp .env.example .env
```

Edit the `.env` file to configure the variables according to your needs. Below, all available variables are described.

---

## Environment Variables

The project uses several environment variables defined in the configuration files within `src/configs/*.config.ts`. These variables allow you to customize the application's behavior. Below is a list of all variables, indicating which are mandatory and which have default values.

### General Variables

| Variable              | Description                                                                                  | Mandatory   | Default Value                  | Example                                     |
|-----------------------|----------------------------------------------------------------------------------------------|-------------|--------------------------------|---------------------------------------------|
| `NODE_ENV`            | Execution environment (`development`, `production`, etc.)                                    | No          | `production`                   | `development`                               |
| `PORT`                | Port on which the application will run                                                      | No          | `3000`                         | `4000`                                      |
| `FORCE_HTTPS`         | Force the use of HTTPS for requests                                                         | No          | `false`                        | `true`                                      |
| `ORIGINS`             | List of allowed URLs for CORS, separated by commas                                           | No          | `http://localhost:4200`        | `http://example.com,http://localhost:4200` |

### Issuance Configuration Variables

| Variable              | Description                                                                                  | Mandatory   | Default Value                  | Example                                     |
|-----------------------|----------------------------------------------------------------------------------------------|-------------|--------------------------------|---------------------------------------------|
| `AUTHORIZATION_SERVER`| URL of the authorization server for OpenID4VCI                                               | Yes         | N/A                            | `https://auth.example.com/auth/realms/demo`|
| `MELON_PRIVATE_KEY`   | Issuer's private key (Melon University)                                                      | Yes         | N/A                            | `0xca3e19805a1e71d557346f4aa66f4b17d9f4bd9c2e1f2d6fbfd9a4ff8118ce6e` |
| `MELON_ISSUER_NAME`   | Issuer's name                                                                                | No          | `melon_university`             | `melon_university`                          |
| `MELON_ETHR_DID`      | Issuer's DID for the `ethr` method                                                           | No          | Automatically generated         | `did:ethr:0x1234567890abcdef`               |
| `MELON_NEAR_DID`      | Issuer's DID for the `near` method                                                           | No          | Automatically generated         | `did:near:example.testnet`                  |

### Verification Configuration Variables

| Variable              | Description                                                                                  | Mandatory   | Default Value                  | Example                                     |
|-----------------------|----------------------------------------------------------------------------------------------|-------------|--------------------------------|---------------------------------------------|
| `JWKS_URI`            | URL of the JWKS server to validate JWT tokens                                                | Yes         | N/A                            | `https://auth.example.com/protocol/openid-connect/certs` |

### Network Configuration Variables

| Variable              | Description                                                                                  | Mandatory   | Default Value                  | Example                                     |
|-----------------------|----------------------------------------------------------------------------------------------|-------------|--------------------------------|---------------------------------------------|
| `ETHR_RPC_URL`        | RPC node URL for the Ethereum network                                                        | Yes         | N/A                            | `https://mainnet.infura.io/v3/YOUR-PROJECT-ID` |
| `ETHR_CHAIN_ID`       | Ethereum chain ID                                                                           | No          | `80002`                        | `1`                                         |
| `ETHR_REGISTRY`       | Registry contract address for `ethr` DID                                                    | No          | `0xBC56d0883ef228b2B16420E9002Ece0A46c893F8` | `0xdCa7EF03e98e0DC2B855bE647C39ABe984fcF21B` |

### Frontend Configuration Variables

| Variable              | Description                                                                                  | Mandatory   | Default Value                  | Example                                     |
|-----------------------|----------------------------------------------------------------------------------------------|-------------|--------------------------------|---------------------------------------------|
| `FRONTEND_BASE_URL`   | Base URL of the frontend                                                                     | No          | `http://localhost:4200`        | `http://example.com`                        |

---

## Running the Project

### Development Mode

```bash
yarn start:dev
```

### Production Mode

1. Compile the project:

   ```bash
   yarn build
   ```

2. Start the server:

   ```bash
   yarn start:prod
   ```

---

## Project Structure

The project is organized into modules, each with specific responsibilities. Below are the main modules:

### 1. **ConfigModule**
   - Loads the configurations defined in `src/configs/*.config.ts`.
   - Centralizes environment variables and allows access throughout the application.

### 2. **AuthModule**
   - Manages authentication using JWT.
   - Validates tokens sent in the `Authorization` header of requests.

### 3. **TypeOrmModule**
   - Manages the database connection (default is SQLite).
   - Automatically creates the database if it does not exist.

### 4. **SocketModule**
   - Implements a WebSocket server for real-time communications.
   - Allows notifying the client of events, such as the receipt of verifiable credentials.

### 5. **LoggerModule**
   - Intercepts logs generated in the application.
   - Saves logs to files to facilitate debugging in production.

### 6. **IssuerModule**
   - Implements the **OpenID4VCI** flow for issuing verifiable credentials.
   - Main routes:
     - `GET :issuer_name/.well-known/openid-credential-issuer`: Returns **all supported credentials** by the issuer, including formats and credential types. For example, if the issuer supports 5 types of credentials, this route will list them all.
     - `GET :issuer_name/credential-offer`: Returns a **subset of credentials** that the issuer is offering to the user at that moment. For example, out of the 5 supported types, it may offer only 1 or 2 based on the user's needs.
     - `POST :issuer_name/credential/issue`: Issues a verifiable credential after validating the user's request.

### 7. **VerifierModule**
   - Implements the **SIOPv2** flow for verifying shared credentials.
   - Verifies that the credentials are valid and redirects to the frontend with the result.

---

## Implemented Flows

### 1. **Credential Issuance (OpenID4VCI)**

1. The client requests the supported credentials (`GET :issuer_name/.well-known/openid-credential-issuer`).
2. The client requests the credentials the issuer is offering (`GET :issuer_name/credential-offer`).
3. The client sends a request to issue a credential (`POST :issuer_name/credential/issue`).
4. The server validates the request and issues the credential in JWT format.

### 2. **Credential Verification (SIOPv2)**

1. The client shares a verifiable credential with the verifier.
2. The server validates the credential and its cryptographic proof.
3. If the credential is valid, it redirects to the frontend with a success message; otherwise, it redirects with an error message.

---

## Testing

### Run Unit Tests

```bash
yarn test
```

### Run Coverage Tests

```bash
yarn test:cov
```

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [OpenID4VCI Documentation](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)
- [SIOPv2 Documentation](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)
