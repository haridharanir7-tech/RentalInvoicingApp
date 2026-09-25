const fs = require('fs');
const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/UserManagement.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('filteredUsers.length === 0', 'paginatedUsers.length === 0');
content = content.replace('filteredUsers.map((u) => {', 'paginatedUsers.map((u) => {');

let repl = `</table>
      </div>

      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {filteredUsers.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
        </div>
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>

      {/* Create User Modal`;

content = content.replace('</table>\r\n      </div>\r\n\r\n      {/* Create User Modal', repl);
content = content.replace('</table>\n      </div>\n\n      {/* Create User Modal', repl);

fs.writeFileSync(file, content);
console.log('done');
