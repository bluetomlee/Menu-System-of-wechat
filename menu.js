'use strict';
// epdApp
var menu_module = angular.module('epdApp.menu', ['ngRoute','ui.bootstrap']);

menu_module.controller('MenuController', ['$scope', '$timeout', '$routeParams', '$http', '$rootScope', '$modal','notify','prompt',
    function($scope, $timeout, $routeParams, $http, $rootScope, $modal, notify, prompt) {

    	$timeout(function(){
    			$scope.refreshMenuList();
    	});
    	$scope.applicationId = 1;

    	// 初始化菜单参数
    	var menuOption= {
    		button:[{
	           "name":null,
	           "sub_button":[
	               {
	                   "type":"",
	                   "name":"",
	                   "key":"",
	                   "url":""
	               }
	           ]            
    		}]
    	};

    	// menu list
    	$scope.refreshMenuList = function(){
    		$http
    		.get("/japi/weixin/menu/list?applicationId=" + $scope.applicationId)
    		.success(function(data){
    			$scope.editAble = false;
    			$scope.btn_list = data; 
    			console.log($scope.btn_list)
    		})
    	};

    	$scope.remindConfirm = function(first){
    		if(!first.sub_button){
	    		prompt({
	    			title: '确定添加二级菜单？',
	    			message: '一级菜单的回复内容将失效。'
	    		}).then(function(result){
	    			if(result){
	    				$scope.createTwo(first);
	    			}
	    		})
    		}else{
    			$scope.createTwo(first);
    		}

    	}
		$scope.remindInfor = function(data){
			if(data.success){
				notify({
					message: '操作成功',
					classes: 'alert-success'
				})
			}else{
				notify({
					message: '操作失败',
					classes: 'alert-success'
				})
			}
		};
		$scope.remindPublish = function(data){
			if(data){
				prompt({
					title: '由于微信客户端缓存，需要 24 小时微信客户端才会展现新菜单',
					message: '可以尝试取消关注企业号后再次关注，即可看到创建后的效果'
				}).then(function(result){
					$scope.publishMenu(data.id);
				})
			}
		}

		$scope.createOne = function(first,add){
			// console.log($scope.disable_list.button);
			prompt({
				title: '请输入一级菜单名称',
				input: true,
			}).then(function(result){
				if(add == 1){
					var a = $scope.btn_list.items.length;
					$scope.btn_list.items.splice(a,0,menuOption);
					$scope.btn_list.items[a].button[0].name = result;
					$scope.newItemStatus = true;
					console.log(a,result)
				}else{
		    		var button = {
			           "name":null,
			           // "sub_button":[
			           //     {
			           //         "type":"",
			           //         "name":"",
			           //         "key":"",
			           //         "url":""
			           //     }
			           // ]            
		    		}
		    		// if(first.btton[0])
					first.button.splice(0,0,button);
					first.button[0].name = result;
					// console.log(111,!first.button[0].type)
				}
			});

			
		};
		$scope.createTwo = function(first){
			// console.log(1,first,first.sub_button)
			prompt({
				title: '请输入二级菜单名称',
				input: true,
			}).then(function(result){
				if(!first.sub_button){
					first.sub_button = [];
				}
				first.sub_button.splice(0,0,{'name':result})
			});			
		}

		$scope.editInput = function(data){
			prompt({
				title: '请修改菜单名称',
				input: true,
				value: data.name
			}).then(function(result){
				data.name = result;
			});
		}
		 
		$scope.removeItems = function(data,index){
			prompt({
				title:'Confirm',
				message: '确认删除菜单'
			}).then(function(){
				data.splice(index,1);
			})

		}
		
		$scope.reply_keywords=[];
		if(!$scope.reply_keywords.length){
			$http.get("/japi/weixin/autoreply/keywords/listall?applicationId=" + $scope.applicationId).success(function(data){
				console.log(data);
				$scope.reply_keywords = data.keywords;
			})
		}
		
		
		$scope.open = function (parent,second,index,one) {
			console.log(second);
			$scope.parentMenu = parent;
			$scope.second = second;
			$scope.index = index;
			$scope.one = one;
			console.log($scope.one);
			if(second.url){
				$scope.replyType  = 'view';
				$scope.reply_link = second.url;
			}else if(second.key){
				$scope.replyType = 'keyword';
				$scope.reply_keyword = second.key;
			}
			var modalInstance = $modal.open({
			  templateUrl: 'm1.html',
			  controller: 'replyModalCtrl',
			  size: "",
			  scope: $scope,
			  resolve: {
			  }
			});
			modalInstance.result.then(function(saveReply){
				if(one == undefined){
					$scope.btn_list.items[$scope.parentMenu].button[$scope.index] = saveReply;
				}else{
					$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index] = saveReply;
				}
				console.log(one,saveReply);
			}); 
		};
		
		
		$scope.cloneObj = function (obj){

			var o, obj;  
			if (obj.constructor == Object){  
				o = new obj.constructor();   
			}else{  
				o = new obj.constructor(obj.valueOf());   
			}  
			for(var key in obj){  
				if ( o[key] != obj[key] ){   
					if ( typeof(obj[key]) == 'object' ){   
						o[key] = $scope.cloneObj(obj[key]);  
					}else{  
						o[key] = obj[key];
					}  
				}  
			}  
			o.toString = obj.toString;  
			o.valueOf = obj.valueOf;  
			return o;

		}
		
		$scope.saveMenu = function(ibtn){
			
			var postData = $scope.cloneObj(ibtn);
		
			if(!postData.id){
				$scope.createMenu(postData.button);
			}
			else{
				
				//console.log(postData);
				//return;
				var _error=0;
				if(postData.button.length){
					
					var tempBtnArr =[];
					for(var p=0;p<postData.button.length;p++){
						
						var btn = postData.button[p];
						var sub_btn = btn.sub_button
						//console.log(btn);
						
						if( sub_btn==undefined ){
							
							if(btn.type=='' && btn.key==''){
								_error++;
								notify({
										message: '保存失败：请为菜单【'+btn.name+'】添加回复',
										classes: 'alert-error'
									})
									
								break;

							}

						}else{
								
							if(sub_btn.length<1)break;
							var t_arr=[];
							for(var i = 0;i<sub_btn.length;i++){
								
								if(sub_btn[i].type == undefined){
									_error++;
									notify({
										message: '保存失败：请为菜单【'+sub_btn[i].name+'】添加回复',
										classes: 'alert-error'
									})
									
									break;
								}
								
								//console.log(sub_btn[i].type, sub_btn[i].type!='' && sub_btn[i].key!='');
								if( sub_btn[i].type!='' && sub_btn[i].key!='' ){
									
									t_arr.push(sub_btn[i])

								}

							}
							//console.log(t_arr);
							if(!t_arr.length){
								delete btn.sub_button
							}else{
								btn.sub_button = t_arr;
							}
						
						}
						
						tempBtnArr.push(btn);
						
						
					};
					
					postData.button = tempBtnArr;
					
				}
				
				console.log(postData);
				if(_error>0){
					return;
				}
				//return;
				
				$http({
					method: 'POST',
					url:'/japi/weixin/menu/edit',
					dataType: 'Json',
					data: {
						applicationId: $scope.applicationId,
						id: postData.id,
						"button":postData.button
					},
					headers:{'Content-Type': 'application/x-www-form-urlencoded'}
				}).success(function(data){
					if(data.success){
						prompt({
							title: '保存成功,是否直接发布',
							message: '由于微信客户端缓存，需要 24 小时微信客户端才会展现效果'
						}).then(function(result){
							console.log(postData.id);
							$scope.remindPublish(postData);		

						})
					}else{
						$scope.remindInfor(data);
					}

				})
			}
		};

		$scope.removeMenu = function(id){
			console.log(id);
			$http({
				method: 'POST',
				url: '/japi/weixin/menu/delete?id=' + id +'&applicationId=' + $scope.applicationId,
				dataType: 'Json',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(function(data){
				$scope.remindInfor(data);
				$scope.refreshMenuList();
			})
		};
		$scope.createMenu = function(ibtn){
			$http({
				method: 'POST',
				url: '/japi/weixin/menu/add',
				dataType: 'json',
				data: {
					applicationId: $scope.applicationId,
					   "button":ibtn
				},
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(function(data){
				if(data.success){
					$scope.remindInfor(data);
					$scope.refreshMenuList();
				}

			})
		};

		$scope.publishMenu = function(id){
			$http({
				method: 'POST',
				dataType: 'json',
				url: '/japi/weixin/menu/publish?id=' + '&applicationId=' + $scope.applicationId,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(function(data){
				var item = $scope.btn_list.items;
				var cur_it;
					console.log(item);
				//将已开启的关闭
				for (var i = item.length - 1; i >= 0; i--) {
					if(item[i].id == id)cur_it=item[i];
					if(item.active){
						$scope.disable(item.id);
					}
				};
				//将操作那一项开启
				cur_it.active = true;
				
				$scope.remindInfor(data);
			})
		};
		
		$scope.disable = function(id){
			$http({
				method: 'POST',
				url: '/japi/weixin/menu/disable?id=' + id + '&applicationId=' + $scope.applicationId,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(function(data){
				var item = $scope.btn_list.items;
				var cur_it;
				
				for (var i=0;i<item.length;i++) {
					if(item[i].id == id)cur_it=item[i];
				};
				
				cur_it.active = false;
				
				$scope.remindInfor(data);
			})
		};
    }]
);


menu_module.controller('replyModalCtrl',['$scope', '$http','$timeout','$modal', '$modalInstance', function($scope, $http, $timeout,$modal,$modalInstance){
	$scope.save_reply = function () {
		if($scope.replyType=='keyword'){
			for (var i = $scope.reply_keywords.length - 1; i >= 0; i--) {
				if($scope.reply_keywords[i].key == $scope.reply_keyword){
					$scope.replyType = $scope.reply_keywords[i].type;
				}
			};
		}
		var data = {success:true}
		if($scope.one == undefined){
			if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.index].type){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.index].type = ''
			}else if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.index].key){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.index].key = ''
			}else if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.index].url){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.index].url = ''
			}
			$scope.btn_list.items[$scope.parentMenu].button[$scope.index].type = $scope.replyType;
			$scope.btn_list.items[$scope.parentMenu].button[$scope.index].key = $scope.reply_keyword;
			$scope.btn_list.items[$scope.parentMenu].button[$scope.index].url = $scope.reply_link;
			$modalInstance.close($scope.btn_list.items[$scope.parentMenu].button[$scope.index]);
		}else{
			if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].type){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].type = ''
			}else if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].key){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].key = ''
			}else if(!$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].url){
				$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].url = ''
			}
			console.log($scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index]);
			$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].type = $scope.replyType;
			$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].key = $scope.reply_keyword;
			$scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index].url = $scope.reply_link;
			$modalInstance.close($scope.btn_list.items[$scope.parentMenu].button[$scope.one].sub_button[$scope.index]); 
		}
		$scope.remindInfor(data);
		// console.log(111,$scope.reply_keyword,$scope.btn_list.items[$scope.parentMenu].button[$scope.one]);
		
		$modalInstance.dismiss('cancel');  
		$scope.replyType=null;
		$scope.reply_keyword=null;
		$scope.reply_link=null;

	};
	
}]);
