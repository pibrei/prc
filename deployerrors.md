Run cd frontend
> frontend@0.0.0 build
> tsc -b && vite build
Error: src/components/DebugAuth.tsx(49,29): error TS18046: 'err' is of type 'unknown'.
Error: src/components/TestConnection.tsx(44,15): error TS6133: 'data' is declared but its value is never read.
Error: src/components/auth/LoginPage.tsx(181,14): error TS2322: Type '{ children: string; jsx: true; }' is not assignable to type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
  Property 'jsx' does not exist on type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
Error: src/components/location/LocationPermissionBanner.tsx(4,21): error TS6133: 'AlertCircle' is declared but its value is never read.
Error: src/components/location/LocationPermissionBanner.tsx(8,5): error TS6133: 'userLocation' is declared but its value is never read.
Error: src/components/pdf/PDFPropertyReport.tsx(150,38): error TS6133: 'index' is declared but its value is never read.
Error: src/components/ui/dialog.tsx(2,1): error TS6133: 'X' is declared but its value is never read.
Error: src/components/upload/BattalionBadgeUpload.tsx(32,52): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(37,38): error TS18047: 'userProfile' is possibly 'null'.
Error: src/components/upload/BattalionBadgeUpload.tsx(37,50): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(60,52): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(86,38): error TS18047: 'userProfile' is possibly 'null'.
Error: src/components/upload/BattalionBadgeUpload.tsx(86,50): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(120,52): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(134,38): error TS18047: 'userProfile' is possibly 'null'.
Error: src/components/upload/BattalionBadgeUpload.tsx(134,50): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/components/upload/BattalionBadgeUpload.tsx(176,92): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/contexts/AuthContext.tsx(207,27): error TS2322: Type '{ user: User | null; userProfile: { id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; } | null; ... 4 more ...; initializing: boolean; }' is not assignable to type 'AuthContextType'.
  The types returned by 'signIn(...)' are incompatible between these types.
    Type 'Promise<{ user: User; session: Session; weakPassword?: WeakPassword | undefined; }>' is not assignable to type 'Promise<void>'.
      Type '{ user: User; session: Session; weakPassword?: WeakPassword | undefined; }' is not assignable to type 'void'.
Error: src/pages/Map.tsx(16,5): error TS6133: 'DefaultIcon' is declared but its value is never read.
Error: src/pages/Map.tsx(116,68): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(116,95): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(117,39): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(118,34): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(282,38): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(283,33): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(383,63): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(383,103): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Map.tsx(659,38): error TS7006: Parameter 'cluster' implicitly has an 'any' type.
Error: src/pages/Properties.tsx(94,39): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(95,34): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(115,27): error TS2339: Property 'crpm' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(116,31): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(347,26): error TS2339: Property 'crpm' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(348,30): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(456,37): error TS2339: Property 'batalhao' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/Properties.tsx(456,63): error TS2339: Property 'cia' does not exist on type '{ id: string; email: string; role: "standard_user" | "team_leader" | "admin"; full_name: string; badge_number: string | null; department: string | null; created_at: string; updated_at: string; }'.
Error: src/pages/PropertyImport.tsx(485,67): error TS2339: Property 'message' does not exist on type '{ success: boolean; data: { successful: number; failed: number; skipped: number; total: number; }; } | { success: boolean; data: { successful: number; failed: number; skipped: number; total: number; }; message: string; }'.
  Property 'message' does not exist on type '{ success: boolean; data: { successful: number; failed: number; skipped: number; total: number; }; }'.
Error: src/pages/PropertyImport.tsx(535,23): error TS2345: Argument of type '{ success: boolean; message: string; data: { successful: number; failed: number; skipped: number; total: number; }; }' is not assignable to parameter of type 'SetStateAction<ImportResult | null>'.
  Type '{ success: boolean; message: string; data: { successful: number; failed: number; skipped: number; total: number; }; }' is not assignable to type 'ImportResult'.
    Types of property 'data' are incompatible.
      Property 'results' is missing in type '{ successful: number; failed: number; skipped: number; total: number; }' but required in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(544,31): error TS2769: No overload matches this call.
  Overload 1 of 3, '(name: string, value: string | Blob): void', gave the following error.
    Argument of type 'File | null' is not assignable to parameter of type 'string | Blob'.
      Type 'null' is not assignable to type 'string | Blob'.
  Overload 2 of 3, '(name: string, value: string): void', gave the following error.
    Argument of type 'File | null' is not assignable to parameter of type 'string'.
      Type 'null' is not assignable to type 'string'.
  Overload 3 of 3, '(name: string, blobValue: Blob, filename?: string | undefined): void', gave the following error.
    Argument of type 'File | null' is not assignable to parameter of type 'Blob'.
      Type 'null' is not assignable to type 'Blob'.
Error: src/pages/PropertyImport.tsx(561,22): error TS18047: 'response.body' is possibly 'null'.
Error: src/pages/PropertyImport.tsx(566,11): error TS6133: 'lastProgressUpdate' is declared but its value is never read.
Error: src/pages/PropertyImport.tsx(588,28): error TS18047: 'recentCount' is possibly 'null'.
Error: src/pages/PropertyImport.tsx(687,23): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(717,21): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(773,19): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(891,42): error TS2769: No overload matches this call.
  Overload 1 of 2, '(id: number | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'number | undefined'.
      Type 'null' is not assignable to type 'number | undefined'.
  Overload 2 of 2, '(timeout: string | number | Timeout | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'string | number | Timeout | undefined'.
      Type 'null' is not assignable to type 'string | number | Timeout | undefined'.
Error: src/pages/PropertyImport.tsx(899,42): error TS2769: No overload matches this call.
  Overload 1 of 2, '(id: number | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'number | undefined'.
      Type 'null' is not assignable to type 'number | undefined'.
  Overload 2 of 2, '(timeout: string | number | Timeout | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'string | number | Timeout | undefined'.
      Type 'null' is not assignable to type 'string | number | Timeout | undefined'.
Error: src/pages/PropertyImport.tsx(918,32): error TS2769: No overload matches this call.
  Overload 1 of 2, '(id: number | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'number | undefined'.
      Type 'null' is not assignable to type 'number | undefined'.
  Overload 2 of 2, '(timeout: string | number | Timeout | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'string | number | Timeout | undefined'.
      Type 'null' is not assignable to type 'string | number | Timeout | undefined'.
Error: src/pages/PropertyImport.tsx(934,30): error TS2769: No overload matches this call.
  Overload 1 of 2, '(id: number | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'number | undefined'.
      Type 'null' is not assignable to type 'number | undefined'.
  Overload 2 of 2, '(timeout: string | number | Timeout | undefined): void', gave the following error.
    Argument of type 'number | null' is not assignable to parameter of type 'string | number | Timeout | undefined'.
      Type 'null' is not assignable to type 'string | number | Timeout | undefined'.
Error: src/pages/PropertyImport.tsx(959,17): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(987,15): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1337,36): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1339,90): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1348,86): error TS2339: Property 'totalInFile' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1354,53): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1358,122): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1359,38): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1361,62): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1365,36): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1384,53): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1384,87): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1388,38): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1392,36): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1392,64): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1394,51): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport.tsx(1394,79): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImportBatch.tsx(1,40): error TS6133: 'useMemo' is declared but its value is never read.
Error: src/pages/PropertyImportBatch.tsx(1,49): error TS6133: 'useEffect' is declared but its value is never read.
Error: src/pages/PropertyImportBatch.tsx(40,7): error TS6133: 'REQUIRED_FIELDS' is declared but its value is never read.
Error: src/pages/PropertyImportSingle.tsx(603,95): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImportSingle.tsx(606,77): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(255,19): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(352,15): error TS2353: Object literal may only specify known properties, and 'skipped' does not exist in type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(662,36): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(664,90): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(673,86): error TS2339: Property 'totalInFile' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(679,53): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(683,122): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(684,38): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(686,62): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(690,36): error TS2339: Property 'remaining' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(709,53): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(709,87): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(713,38): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(717,36): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(717,64): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(719,51): error TS2339: Property 'skipped' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/PropertyImport_OLD.tsx(719,79): error TS2339: Property 'skippedItems' does not exist on type '{ successful: number; failed: number; total: number; results: any[]; }'.
Error: src/pages/Register.tsx(5,10): error TS6133: 'ShieldCheck' is declared but its value is never read.
Error: src/pages/Register.tsx(5,23): error TS6133: 'Users' is declared but its value is never read.
Error: src/pages/Register.tsx(183,16): error TS2322: Type '{ children: string; jsx: true; }' is not assignable to type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
  Property 'jsx' does not exist on type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
Error: src/pages/Register.tsx(471,14): error TS2322: Type '{ children: string; jsx: true; }' is not assignable to type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
  Property 'jsx' does not exist on type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
Error: src/pages/Reports.tsx(3,24): error TS7016: Could not find a declaration file for module 'file-saver'. '/home/runner/work/prc/prc/frontend/node_modules/file-saver/dist/FileSaver.min.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/file-saver` if it exists or add a new declaration (.d.ts) file containing `declare module 'file-saver';`
Error: src/pages/Reports.tsx(227,40): error TS2339: Property 'full_name' does not exist on type 'User'.
Error: src/pages/Reports.tsx(240,11): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
Error: src/pages/Reports.tsx(241,11): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
Error: src/pages/Users.tsx(70,10): error TS6133: 'approvalAction' is declared but its value is never read.
Error: src/pages/Users.tsx(70,26): error TS6133: 'setApprovalAction' is declared but its value is never read.
Error: Process completed with exit code 2.