package org.njupt.njuptphysim.pojo.po;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import javax.validation.constraints.NotNull;

import java.io.Serializable;

import java.util.Date;
import io.swagger.annotations.ApiModelProperty;
import org.hibernate.validator.constraints.Length;

/**
* 
* @TableName tasks
*/
public class Tasks implements Serializable {

    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Integer id;
    /**
    * 
    */
    @NotBlank(message="[]不能为空")
    @Size(max= 10,message="编码长度不能超过10")
    @ApiModelProperty("")
    @Length(max= 10,message="编码长度不能超过10")
    private String teacher;
    /**
    * 
    */
    @NotBlank(message="[]不能为空")
    @Size(max= 10,message="编码长度不能超过10")
    @ApiModelProperty("")
    @Length(max= 10,message="编码长度不能超过10")
    private String clazzId;
    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Integer expId;
    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Date startDate;
    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Date endDate;
    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Integer completeCount;
    /**
    * 
    */
    @NotNull(message="[]不能为空")
    @ApiModelProperty("")
    private Integer totalCount;

    /**
    * 
    */
    private void setId(Integer id){
    this.id = id;
    }

    /**
    * 
    */
    private void setTeacher(String teacher){
    this.teacher = teacher;
    }

    /**
    * 
    */
    private void setClazzId(String clazzId){
    this.clazzId = clazzId;
    }

    /**
    * 
    */
    private void setExpId(Integer expId){
    this.expId = expId;
    }

    /**
    * 
    */
    private void setStartDate(Date startDate){
    this.startDate = startDate;
    }

    /**
    * 
    */
    private void setEndDate(Date endDate){
    this.endDate = endDate;
    }

    /**
    * 
    */
    private void setCompleteCount(Integer completeCount){
    this.completeCount = completeCount;
    }

    /**
    * 
    */
    private void setTotalCount(Integer totalCount){
    this.totalCount = totalCount;
    }


    /**
    * 
    */
    private Integer getId(){
    return this.id;
    }

    /**
    * 
    */
    private String getTeacher(){
    return this.teacher;
    }

    /**
    * 
    */
    private String getClazzId(){
    return this.clazzId;
    }

    /**
    * 
    */
    private Integer getExpId(){
    return this.expId;
    }

    /**
    * 
    */
    private Date getStartDate(){
    return this.startDate;
    }

    /**
    * 
    */
    private Date getEndDate(){
    return this.endDate;
    }

    /**
    * 
    */
    private Integer getCompleteCount(){
    return this.completeCount;
    }

    /**
    * 
    */
    private Integer getTotalCount(){
    return this.totalCount;
    }

}
