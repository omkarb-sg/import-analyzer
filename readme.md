# Import Analyzer

**Import Analyzer** is a tool designed to improve the process of importing items into our database. It's built to save time and reduce frustration by catching errors before they cause partial imports and require multiple rounds of troubleshooting.

## Problem Statement

The standard import tool we use currently doesn't report errors until it has processed all preceding items. This often results in partial data imports, requiring users to resolve one error at a time and rerun the import process repeatedly. 

## How Import Analyzer Helps

**Import Analyzer** pre-processes the import data to identify any potential issues before the import begins:
- **Dependency Resolution**: The tool scans the import data to identify all required items and checks if they are present.
- **Database Querying**: If required items are missing in the import data, the tool queries the target database to check if they already exist, ensuring completeness.

By addressing these issues upfront, Import Analyzer prevents partial imports and helps users fix all errors in one go.

## Usage

1. **Install Node.js**: Ensure Node.js is installed on your system.
2. **Run the Tool**:
   ```bash
   npm i
   node main.js /path/to/manifest.mf
   ```
   - You can redirect the output to a text file for easier review.
   
3. **Example output**:
   In the package chess, an identity was not exported (used in life cycle map)
   ```
   Authenticating...
   --- Unresolved ---
   {
     chess: [
       {
         filepath: 'C:\\Users\\LP-T368\\Desktop\\Projects\\aras-chess\\chess\\Import\\Life Cycle Map\\chess.xml',
         node: '<role keyed_name="Aras Chess" type="Identity">74E2D2E4521544C9941A086295F59D21</role>'
       }
     ]
   }
   ```

5. **Configuration**:
   - You can modify `config.js` to change default settings.
   - If the tool needs to resolve objects via the database, ensure your database credentials are correctly set in the `.env` file. Use the `.env.example` file as a template.

## Notes

- **Work in Progress**: This tool is still under development, and there are likely to be improvements and bug fixes in the future.
- **Feedback**: All error reports, suggestions, or ideas for improvement are highly welcome.
