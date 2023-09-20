import cron from "node-cron"
import axios from "axios"
import { getAll } from "./controllers/sam.controller"

console.log(`CRON SERVER START`)
cron.schedule("* * * * *", async () => {
    console.log("========== BEGIN CRON JOB ==========")
    if (!process.env.GET_TOKEN_URL || !process.env.CHEFS_SERVICE_ACCOUNT_USERNAME || !process.env.CHEFS_SERVICE_ACCOUNT_PASSWORD
        || !process.env.CHEFS_API_URL || !process.env.SAM_API_URL || !process.env.SAM_API_PASSWORD || !process.env.SAM_API_URL
        || !process.env.HAVE_EMPLOYEE_FORM_ID || !process.env.USERS_TO_IGNORE
    ) {
        console.log("missing environment variable(s) - aborting cron job")
        return
    }
    const ignoreList = JSON.parse(process.env.USERS_TO_IGNORE)?.users
    const users = await getAll()
    if (users && users.length > 0){
        // Obtain a bearer token to be used for CHEFS authentication //
        const params = new URLSearchParams()
        params.append("grant_type", "client_credentials")
        await axios
            .post(
                process.env.GET_TOKEN_URL, 
                params,
                {
                    auth: {
                        username: `${process.env.CHEFS_SERVICE_ACCOUNT_USERNAME}`,
                        password: `${process.env.CHEFS_SERVICE_ACCOUNT_PASSWORD}`
                    },
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            )
            .then(async (response) => {
                const accessToken = response?.data?.access_token
                if (accessToken){
                    for (const user of users) {
                        console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*")
                        if (ignoreList.includes(user.username.toLowerCase())) { 
                            console.log(`ignoring user ${user.username}`)
                            continue
                        }
                        // For each user, retrieve their unique CHEFS user ID, then give them access to the needed forms //
                        const userResponse = await axios.get(
                            `${process.env.CHEFS_API_URL}/users/`,
                            {
                                params: {
                                    idpUserId: user.guid
                                },
                                headers: {
                                    "Authorization": `Bearer ${accessToken}`
                                }
                            }
                        )
                        .catch((error) => {
                            console.log(error.message)
                            throw new Error
                        })
                        if (userResponse?.data?.length === 1){ // only give user form permissions if one match was found
                            const chefsUserID = userResponse.data[0].id
                            console.log(`Beginning permission granting for user ${user.username}`)
                            await giveFormPermissions(process.env.NEED_EMPLOYEE_FORM_ID as string, chefsUserID, user, accessToken, false)
                            await giveFormPermissions(process.env.HAVE_EMPLOYEE_FORM_ID as string, chefsUserID, user, accessToken, false)
                            await giveFormPermissions(process.env.SERVICE_PROVIDER_CLAIM_FORM_ID as string, chefsUserID, user, accessToken, true)
                        }
                        else if (userResponse?.data?.length === 0){
                            console.log(`user ${user.username} not found in CHEFS - skipping`)
                        }
                        else {
                            console.log(`user ${user.username} returned multiple results in CHEFS - skipping`)
                        }
                    }
                }
            }
            )
            .catch((error) => {
                console.log(error)
                return error
            })
    }
    console.log("========== END CRON JOB ==========")
})

const giveFormPermissions = async (formID: string, chefsUserID: string, user: any, accessToken: string, isTeamProtected: boolean) => {
    let formPermissions = [{
        formId: formID,
        role: "submission_reviewer",
        userId: chefsUserID
    }]
    if (user.idp === "IDIR"){ // IDIR users also get team_manager by default
        formPermissions.push({
            formId: formID,
            role: "team_manager",
            userId: chefsUserID                        
        })
    }
    if (isTeamProtected){ // users in team protected forms also get form_submitter by default
        formPermissions.push({
            formId: formID,
            role: "form_submitter",
            userId: chefsUserID                        
        })
    }
    await axios.put(
        `${process.env.CHEFS_API_URL}/rbac/forms`,
        formPermissions,
        {
            params: {
                formId: formID,
                userId: chefsUserID
            },
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        }
    )
    .then(() => {
        console.log(`successfully gave user ${user.username} access to form ${formID}`)
    })
    .catch((error) => {
        console.log(error.message)
        throw new Error
    })
}
