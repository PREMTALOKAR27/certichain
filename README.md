# CERTICHAIN

Blockchain-Based Academic Certificate Verification System

CERTICHAIN is a CSE college practical project. Phase 1 provides the Solidity certificate registry and local Hardhat setup. Phase 2 adds the Express API, MongoDB models, JWT/bcrypt authentication, deterministic certificate hashing, and local-chain integration. Phase 3 adds the React frontend for institution workflows, student records, and public verification. Phase 4 adds PDF/QR generation, revocation controls, and chain record timestamps.

## Phase 1: Local blockchain

Prerequisites: Node.js 20 or later and npm. Use separate PowerShell terminals for the node and deployment commands.

```powershell
cd .\certichain\blockchain
npm install
npm run typecheck
npm test
```

Start a local Hardhat blockchain in the first terminal:

```powershell
cd .\certichain\blockchain
npm run node
```

Deploy the contract in a second terminal while the node is running:

```powershell
cd .\certichain\blockchain
npm run deploy
```

The deployment prints the registry address and deployer wallet. The node runs on `http://127.0.0.1:8545` with chain ID `31337`. Its generated accounts and keys are for local development only; never use them on a public network or put private keys in project files.

## Contract behavior

- The deployer starts as the contract owner and an authorized issuer.
- Only the owner can authorize or deauthorize issuer wallet addresses.
- Authorized issuers can issue and revoke certificates; certificate IDs cannot be reused.
- Revocation marks the existing record and does not delete it.
- Verification reports whether the record exists, its supplied hash matches, and whether it is revoked.
- Only the certificate hash and issuance metadata are stored on-chain, never a certificate PDF.

The backend generates a deterministic Keccak-256 hash from ordered, normalized certificate fields and sends only that hash to the registry. The PDF is never stored on-chain.

## Phase 2: Backend API

Prerequisites: MongoDB Community Server and Node.js 20 or later. Start MongoDB as a Windows service in its own PowerShell terminal:

```powershell
Start-Service MongoDB
mongosh "mongodb://127.0.0.1:27017/certichain"
```

If MongoDB is not installed as a service, start `mongod --dbpath .\data\mongodb` instead (create that data directory first) and keep its terminal open.

Start the Hardhat node and deploy the contract as shown in Phase 1. Copy the printed registry address. Then set up the API in another terminal:

```powershell
cd .\certichain\backend
npm install
Copy-Item .env.example .env
```

Edit `backend\.env`: set a random `JWT_SECRET` (at least 32 characters), a unique `ADMIN_PASSWORD` (at least 12 characters), and the deployed `CERTIFICATE_REGISTRY_ADDRESS`. Leave `ISSUER_ACCOUNT_INDEX=0`; the backend uses the unlocked first local Hardhat account and does not need a private key. Do not use this local account on a public network.

```powershell
npm run typecheck
npm test
npm run dev
```

The API listens at `http://localhost:4000`. On first startup it creates the administrator specified by `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Student registration always creates a `STUDENT`; the public verifier requires no login.

Implemented routes:

- `POST /api/auth/register` and `POST /api/auth/login`
- `POST /api/certificates`, `GET /api/certificates`, and `GET /api/certificates/:id`
- `GET /api/certificates/:id/download` and `GET /api/certificates/:id/qr`
- `GET /api/certificates/:id/verify` and `PATCH /api/certificates/:id/revoke`
- `GET /api/verify/:certificateId` (public)
- `GET /api/dashboard/stats` and `GET /api/verifications` (administrator)

Authenticated requests use `Authorization: Bearer <token>`. Admins can issue and revoke certificates. Students can only list or view certificates linked to their account. Verification responses include the original and submitted hashes, blockchain result, and issuance transaction reference; revocation stores its separate transaction hash without replacing the issuance transaction.

PDF/QR generation and the web interface are implemented in later phases.

## Phase 3: Frontend

Keep MongoDB, the Hardhat node, the deployed registry, and the backend running as described above. In another PowerShell terminal:

```powershell
cd .\certichain\frontend
npm install
Copy-Item .env.example .env
npm run typecheck
npm run dev
```

Open `http://localhost:5173`. Institution administrators sign in at `/login/institution`; students sign in or register at `/login/student`. Each portal checks the account role, and student registration is not available from the institution login. The frontend uses `VITE_API_URL` from `frontend\.env` (default `http://localhost:4000`), matching the backend's default CORS origin. It includes role-specific dashboards and certificate lists, admin issuance, local chain activity, public verification, and a short blockchain explainer.

## Phase 4: Documents and revocation

The backend generates landscape academic certificate PDFs on demand and streams them to the authenticated owner or an administrator. PDFs include a QR code containing the public verification URL, certificate details, issuer, and issuance transaction hash; PDF files are not saved to MongoDB or the blockchain. The authenticated QR endpoint returns a PNG data URL and its verification URL to the certificate owner or an administrator. Admin certificate lists support a confirmation step before on-chain revocation. Issuance and revocation transactions retain separate hashes, block numbers, and block timestamps, and the chain activity page displays each as a distinct record.

## Phase 5: Validation

Run these checks from separate PowerShell terminals in each project folder:

```powershell
cd .\certichain\blockchain
npm run typecheck
npm test
```

```powershell
cd .\certichain\backend
npm run typecheck
npm test
npm run build
```

```powershell
cd .\certichain\frontend
npm run build
```

The backend tests cover deterministic hashing, Unicode normalization, whitespace normalization, and tamper sensitivity. For a realistic tamper demonstration, use a dedicated active test certificate. Do not change `certificateHash` or use a revoked certificate; revocation takes precedence in the public result.

Keep one `mongosh` session open for both the change and restoration, so the original value stays in a shell variable:

```javascript
mongosh "mongodb://127.0.0.1:27017/certichain"
use certichain
const certificateId = "REPLACE-WITH-ACTIVE-CERTIFICATE-ID";
const record = db.certificates.findOne({ certificateId, status: "ACTIVE" });
if (!record) throw new Error("Choose an active test certificate");
const originalStudentName = record.studentName;
db.certificates.updateOne({ _id: record._id }, { $set: { studentName: "Manually Changed Name" } });
```

Refresh `/verify/REPLACE-WITH-ACTIVE-CERTIFICATE-ID` to see `TAMPERED` and `HASH MISMATCH`. Then restore the original field in the same `mongosh` session:

```javascript
db.certificates.updateOne(
  { _id: record._id },
  { $set: { studentName: originalStudentName } },
);
```

The full local demo is: student/admin authentication, issue, download PDF, view QR, verify valid, edit a MongoDB detail and verify the mismatch, restore it, revoke, and verify revoked.
