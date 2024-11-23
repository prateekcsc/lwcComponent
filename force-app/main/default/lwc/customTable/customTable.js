import { LightningElement, track} from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import retrieveContact from '@salesforce/apex/CustomeTableController.getAccount'
import updateAmount from '@salesforce/apex/CustomeTableController.updateAnnualRevenue'

export default class CustomeTable extends LightningElement {

    page = 1;
    items = [];
    data = [];  

    startingRecord = 1;
    endingRecord = 0;
    pageSize = 10;
    totalRecountCount = 0;
    totalPage = 0;


    get bDisableFirst() {
        return this.page == 1;
    }
    get bDisableLast() {
        return this.page == this.totalPage;
    }

    connectedCallback(){

        retrieveContact()
        .then(results=>{
            this.items = JSON.parse(results);
            this.totalRecountCount = results.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            this.data = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
            this.error = undefined;
        })  
        .catch(error=>{
            this.error = error;
            this.data = undefined;
            console.log('Result error:', error)
        })
    }

    recordPerPage(page) {
        this.startingRecord = ((page - 1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount) ? this.totalRecountCount : this.endingRecord;
        this.data = this.items.slice(this.startingRecord, this.endingRecord);
        this.startingRecord = this.startingRecord + 1;
    }
       

    firstPage() {
        this.page = 1;
        this.recordPerPage(this.page)
    }

    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1;
            this.recordPerPage(this.page);
        }
    }

    nextHandler() {
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.recordPerPage(this.page);
        }
    }

    lastPage() {
        this.page = this.totalPage;
        this.recordPerPage(this.page)
    }

    handleOnChange(event){
        const inputId = event.target.dataset.selectedInput
        const amount = event.target.value

        this.items.forEach(e => {
            {
                if(e.Id === inputId)
                {
                    e.Amount = amount;
                }
            }
        });
       
        const input = this.template.querySelector(`[data-selected-input="${inputId}"]`)
        input.setAttribute('disabled')
    }

    handleEdit(event){
        const editId = event.target.dataset.editId;
        const td = this.template.querySelector(`[data-selected-td="${editId}"]`)
        td.style.backgroundColor = 'LemonChiffon'
        const input = this.template.querySelector(`[data-selected-input="${editId}"]`)
        input.removeAttribute('disabled')
        input.focus()
    }

    handleCheck(event){
        const id = event.target.dataset.checkId
        const checked = event.target.checked
        this.items.forEach(e => {
            {
                if(e.Id===id)
                {
                    e.isSelected = checked ;
                }
            }
        });

       
    }

    async handleSave(){

        let toBeupdated=[];

        this.items.forEach(e => {
            {
                if(e.isSelected===true)
                {
                    toBeupdated.push(e);
                }
            }
        });  

        if(toBeupdated.length > 0 ) {
            try{
                //Pass edit field to CustomeTableController controller
                console.log('toBeupdated:', JSON.stringify(toBeupdated))
                const result = await updateAmount({data:toBeupdated})
                console.log(JSON.stringify('Apex result:', result))

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record updated successfully',
                        variant: 'success'
                    })
                )
            } catch(error) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating',
                        message: error.body.message,
                        variant: 'error'
                    })
                )
            }
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No record selected !',
                    variant: 'error'
                })
            )
        }
        this.handleCancel();
    }

    navigateToContact(e){
        const contId = e.target.dataset.contactId;
        this.template.querySelector(`[data-contact-id="${contId}"]`).href=`/lightning/r/${contId}/view`;
    }
   
    handleCancel() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}