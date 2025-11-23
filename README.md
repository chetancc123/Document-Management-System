# Document Management System

A Document Management System (DMS) is a centralized, secure platform designed to store, organize, search, and manage digital documents efficiently. It streamlines the entire document lifecycle—from uploading and tagging files to previewing, downloading, and retrieving them using flexible filters such as categories, dates, and keywords. By automating document handling and providing controlled access through OTP-based authentication, a DMS improves productivity, reduces manual effort, and ensures documents are always accessible, well-organized, and easy to manage for both users and administrators.

Steps to clone in local

# 1. clone the repo
git clone https://github.com/chetancc123/Document-Management-System.git
cd Document-Management-System

# 2. install dependencies
npm install

# 3. run the dev server
npm run dev
(Since it was initailized using vite)

# 5. open in browser
 http://localhost:5173 (Vite)


How to use the app

Open the app in the browser.

Login with OTP:

Enter the registered mobile number and request OTP (this calls the backend generateOTP / similar endpoint).

Validate OTP via the validation endpoint — response includes a token.

The app stores that token in localStorage as dms_token.

Protected area (Dashboard):

After successful login the app navigates to /dashboard → redirected to /dashboard/documents.

ProtectedRoute component blocks access if dms_token is missing.

Documents page:

Search/filter (Category, Name/Dept, Tags, Date range, free-text).

Results are shown paginated (10 rows per page). Each row shows metadata and actions.

View: opens the file URL (presigned S3 URL) in a new tab.

Download: attempts direct open/download of presigned URL, As unable to implement zip file creation due to CORS errrr

Upload Documents:

The Upload form builds a FormData with:

file — the uploaded file (image or pdf)

data — a JSON string containing major_head, minor_head, document_date (dd-MM-yyyy required), document_remarks, tags (array of {tag_name: "..."}), user_id, etc.

The upload request uses header token with the saved token.
