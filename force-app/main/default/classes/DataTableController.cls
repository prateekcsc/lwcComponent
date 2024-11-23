public class DataTableController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getRecords(String searchKey, String sortBy, String sortByType, String sortOrder, Integer pageSize, 
                                              String after, String lastId, String before, String firstId, boolean first, boolean last, Integer lastPageSize) { 
        List<Account> records = null;
        String query = 'SELECT Id, Name, Industry, AnnualRevenue FROM Account ';
        if(searchKey != ''){        
        String textFilter = '%'+searchKey+'%';
            query += 'where  Name Like :textFilter ' ;
        }
        if((after != '' && !last) || (before != '' && !first)) {
            String param = ':textParam';
            String textParam = after != ''&& after != 'NULL' ? after : (before != '' && before != 'NULL' ? before : null);
            if(sortByType == 'Number' && textParam != null) {
                param = ':numberParam';                
                Integer numberParam = Integer.valueOf(textParam);
            } else if(sortByType == 'Date' && textParam != null) {
                param = ':dateParam';                
                Date dateParam = Date.valueOf(textParam);
            } 
            
            String field = sortBy;                
            if(after != '' && !last) {
                String operator = sortOrder == 'asc' ? '>': '<';     
                if(after == 'NULL') {
                    query += 'and (' + field + ' != NULL OR ('+field+'= NULL AND Id'+ operator +'\''+lastId+'\')) ';
                } else if(sortOrder == 'desc') {
                    query += 'and (' + field + operator + param + ' OR '+field+' = NULL OR ('+field+'='+param+' AND Id'+ operator +'\''+lastId+'\')) ';
                } else {
                    query += 'and (' + field + operator + param + ' OR ('+field+'='+param+' AND Id'+ operator +'\''+lastId+'\')) ';
                }
            } else if(before != '' && !first) {
                String operator = sortOrder == 'asc' ? '<': '>';     
                if(before == 'NULL') {
                    query += 'and (' + field + ' != NULL OR ('+field+'= NULL AND Id'+ operator +'\''+firstId+'\')) ';
                } else if(sortOrder == 'asc') {
                    query += 'and (' + field + operator + param + ' OR '+field+' = NULL OR ('+field+'='+param+' AND Id'+ operator +'\''+firstId+'\')) ';
                } else {
                    query += 'and (' + field + operator + param + ' OR ('+field+'='+param+' AND Id'+ operator +'\''+firstId+'\')) ';
                }
            }
        }
        
        String orderQuery = '';                                         
        if(last || (before != '' && !first)) {
            orderQuery = 'Order BY ' + sortBy + ' ' + (sortOrder == 'asc' ? 'desc NULLS LAST ': 'asc NULLS FIRST ') + ', Id '+ (sortOrder == 'asc' ? 'desc': 'asc'); 
        } else {
            orderQuery = 'Order BY ' + sortBy + ' ' + (sortOrder == 'asc' ? 'asc NULLS FIRST ': 'desc NULLS LAST ') + ', Id '+ sortOrder;        
        }
        query += orderQuery + ' LIMIT ' + (last && lastPageSize > 0 ? lastPageSize : pageSize);
        System.debug(query);
        records = Database.query(query);
                                                  
        if((before != '' && !first) || last) {
            List<Account> tmp = new List<Account>();
            for(Integer i=records.size()-1; i>=0; i--) {
                tmp.add(records.get(i));
            }
            records = tmp;
        } 
        return records;
    }
    
    @AuraEnabled(cacheable=true)
    public static Integer getCount() { 
        String query = 'SELECT Count() FROM Account';
        return Database.countQuery(query);
    }
}