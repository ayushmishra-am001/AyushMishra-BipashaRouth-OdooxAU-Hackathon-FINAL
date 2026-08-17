-- Step 1: Create the 'user' role
CREATE USER "user" WITH PASSWORD 'Bipasha2005';

-- Step 2: Create the rms_dev database
CREATE DATABASE rms_dev OWNER "user";

-- Step 3: Grant permissions
GRANT ALL PRIVILEGES ON DATABASE rms_dev TO "user";
