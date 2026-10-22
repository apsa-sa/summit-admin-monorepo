// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { User,UserPage,Draft,AuditEvent,Role,Status } from './index.js';
import type { UserTableColumn,UserTablePreferences } from './table-preferences.js';
export class ContractViolation extends Error { constructor(){super('invalid_response');} }
/** Runtime response contracts shared with the browser; no server dependencies. */
export class ResponseContracts {
  private record(value:unknown):Record<string,unknown>{
    if(typeof value!=='object'||value===null||Array.isArray(value))throw new ContractViolation();
    return Object.fromEntries(Object.entries(value));
  }
  private text(value:unknown,max=4096):string{if(typeof value!=='string'||value.length>max)throw new ContractViolation();return value;}
  private integer(value:unknown,min=0,max=Number.MAX_SAFE_INTEGER):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)throw new ContractViolation();return value;}
  private uuid(value:unknown):string{const id=this.text(value,36);if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new ContractViolation();return id;}
  private role(value:unknown):Role{if(value!=='admin'&&value!=='editor'&&value!=='viewer')throw new ContractViolation();return value;}
  private status(value:unknown):Status{if(value!=='active'&&value!=='invited'&&value!=='suspended')throw new ContractViolation();return value;}
  private date(value:unknown):string{const date=this.text(value,40);if(!Number.isFinite(Date.parse(date)))throw new ContractViolation();return date;}
  user(value:unknown):User{
    const row=this.record(value);
    // Return an explicitly selected DTO; never propagate arbitrary response fields.
    return {id:this.uuid(row.id),name:this.text(row.name,120),email:this.text(row.email,254),role:this.role(row.role),status:this.status(row.status),version:this.integer(row.version),createdAt:this.date(row.createdAt)};
  }
  userEnvelope(value:unknown):User{return this.user(this.record(value).user);}
  page(value:unknown):UserPage{
    const row=this.record(value);if(!Array.isArray(row.rows)||row.rows.length>10000)throw new ContractViolation();
    const rows=row.rows.map(value=>this.user(value));const pageSize=this.integer(row.pageSize,1);
    if(rows.length>pageSize)throw new ContractViolation();
    return {rows,total:this.integer(row.total),page:this.integer(row.page,1),pageSize};
  }
  draft(value:unknown):Draft{const row=this.record(value);return {name:this.text(row.name,120),organization:this.text(row.organization,120),version:this.integer(row.version)};}
  audit(value:unknown):AuditEvent[]{
    const rows=this.record(value).rows;if(!Array.isArray(rows)||rows.length>100)throw new ContractViolation();
    return rows.map(value=>{const row=this.record(value);return {id:this.uuid(row.id),actorId:this.uuid(row.actorId),action:this.text(row.action,120),resourceId:this.uuid(row.resourceId),requestId:this.uuid(row.requestId),createdAt:this.date(row.createdAt)};});
  }
  private tableColumn(value:unknown):UserTableColumn {
    if(value==='name'||value==='email'||value==='role'||value==='status'||value==='created_at')return value;
    throw new ContractViolation();
  }
  tablePreferences(value:unknown):UserTablePreferences {
    const row=this.record(value),query=this.record(row.query);
    if(Object.keys(row).some(key=>!['query','columns','version'].includes(key))||Object.keys(query).some(key=>!['search','role','status','page','sort'].includes(key)))throw new ContractViolation();
    const role=this.text(query.role),status=this.text(query.status),sort=query.sort;
    if(role)this.role(role);if(status)this.status(status);
    if(sort!=='name'&&sort!=='created_at')throw new ContractViolation();
    if(!Array.isArray(row.columns)||row.columns.length<1||row.columns.length>5)throw new ContractViolation();
    const columns=row.columns.map(value=>this.tableColumn(value));
    if(new Set(columns).size!==columns.length||!columns.includes('name'))throw new ContractViolation();
    return {query:{search:this.text(query.search,120),role,status,page:this.integer(query.page,1,100000),sort},columns,version:this.integer(row.version,0,2147483647)};
  }
  ok(value:unknown):void{if(this.record(value).ok!==true)throw new ContractViolation();}
  deleted(value:unknown):void{if(this.record(value).user!==null)throw new ContractViolation();}
}
